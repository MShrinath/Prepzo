import os
import re
import json
import time
import logging
from typing import Type, TypeVar, Optional, Any, Dict
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMResponse:
    """Lightweight response wrapper with .content property."""
    def __init__(self, content: str):
        self.content = content

    def __str__(self):
        return self.content


class MockLLM:
    """A deterministic mock LLM used when no external API key is provided or for offline testing."""
    def __init__(self, model_name: str = "mock-model"):
        self.model_name = model_name

    def invoke(self, prompt: Any) -> LLMResponse:
        return LLMResponse("Mock LLM text response.")


class LLMStatusTracker:
    """
    Tracks runtime health and circuit-breaker state of the configured LLM API.
    Prevents repeated network hanging when an API key is invalid, expired, or rate-limited.
    Provides transparent diagnostics to the frontend and monitoring endpoints.
    """
    def __init__(self):
        self.is_healthy = False
        self.circuit_open = False
        self.last_error: Optional[str] = None
        self.last_error_type: Optional[str] = None
        self.last_checked_at: Optional[float] = None
        self.consecutive_failures = 0
        self.success_count = 0
        self.fallback_count = 0
        self.cooldown_seconds = 60.0

    @property
    def configured_provider(self) -> str:
        return settings.llm_provider.lower()

    @property
    def model(self) -> str:
        return settings.llm_model or "gpt-4o-mini"

    def record_success(self):
        self.is_healthy = True
        self.circuit_open = False
        self.last_error = None
        self.last_error_type = None
        self.consecutive_failures = 0
        self.success_count += 1
        self.last_checked_at = time.time()

    def record_failure(self, error: Exception):
        err_type = error.__class__.__name__
        err_msg = str(error)

        if "AuthenticationError" in err_type or "401" in err_msg:
            friendly = "OpenAI API Key is invalid or unauthorized (HTTP 401). Operating in heuristic fallback mode."
        elif "RateLimitError" in err_type or "429" in err_msg:
            friendly = "OpenAI API rate limit or quota exceeded (HTTP 429). Operating in heuristic fallback mode."
        elif "APITimeoutError" in err_type or "Timeout" in err_type or "timed out" in err_msg.lower():
            friendly = "OpenAI API request timed out (>12s). Operating in heuristic fallback mode."
        elif "APIConnectionError" in err_type or "ConnectionError" in err_type:
            friendly = "Cannot connect to LLM gateway (network or proxy unreachable). Operating in heuristic fallback mode."
        else:
            friendly = f"LLM error ({err_type}): {err_msg[:120]}. Operating in heuristic fallback mode."

        self.is_healthy = False
        self.circuit_open = True
        self.last_error = friendly
        self.last_error_type = err_type
        self.consecutive_failures += 1
        self.fallback_count += 1
        self.last_checked_at = time.time()
        logger.warning(f"[LLM FALLBACK ACTIVE] {friendly}")

    def should_bypass_network(self) -> bool:
        if not self.circuit_open:
            return False
        # Periodic recovery check after cooldown
        if self.last_checked_at and (time.time() - self.last_checked_at > self.cooldown_seconds):
            logger.info("LLM circuit breaker cooldown expired; attempting probe call.")
            self.circuit_open = False
            return False
        return True

    def to_dict(self) -> Dict[str, Any]:
        has_key = bool(
            (settings.openai_api_key and settings.openai_api_key.strip())
            if self.configured_provider == "openai"
            else (settings.google_api_key and settings.google_api_key.strip())
        )
        if self.configured_provider == "mock":
            mode = "mock"
        elif not has_key:
            mode = "unconfigured"
        elif self.circuit_open or self.last_error is not None:
            mode = "fallback"
        else:
            mode = "live"

        return {
            "status": mode,
            "fallback_mode": mode in ("fallback", "unconfigured", "mock"),
            "provider": self.configured_provider,
            "model": self.model,
            "has_api_key": has_key,
            "is_healthy": self.is_healthy if (self.circuit_open or self.last_error) else True,
            "circuit_open": self.circuit_open,
            "last_error": self.last_error,
            "last_error_type": self.last_error_type,
            "consecutive_failures": self.consecutive_failures,
            "fallback_count": self.fallback_count,
            "success_count": self.success_count,
            "last_checked_at": self.last_checked_at,
        }


# Global singleton tracker
status_tracker = LLMStatusTracker()


class DirectOpenAILLM:
    """
    Direct wrapper around official openai.OpenAI SDK (v1.0+) with timeout and exception containment.
    Eliminates fragile dependencies on langchain_openai.
    """
    def __init__(
        self,
        model_name: str,
        api_key: str,
        base_url: Optional[str] = None,
        temperature: float = 0.2,
        timeout: float = 12.0
    ):
        from openai import OpenAI
        self.model_name = model_name
        self.temperature = temperature
        self.timeout = timeout
        kwargs = {"api_key": api_key, "timeout": timeout}
        if base_url and base_url.strip():
            kwargs["base_url"] = base_url.strip()
        self.client = OpenAI(**kwargs)

    def invoke(self, prompt: str) -> LLMResponse:
        res = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": str(prompt)}],
            temperature=self.temperature,
        )
        content = res.choices[0].message.content or ""
        return LLMResponse(content)

    def invoke_json(self, prompt: str) -> str:
        res = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": str(prompt)}],
            temperature=self.temperature,
            response_format={"type": "json_object"},
        )
        return res.choices[0].message.content or "{}"


def parse_json_from_llm(raw_text: str) -> dict:
    """Safely extract and parse JSON object from LLM response text."""
    if not raw_text or not isinstance(raw_text, str):
        return {}
    clean = raw_text.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()

    try:
        return json.loads(clean)
    except Exception:
        pass

    # Regex search for outermost { ... }
    match = re.search(r"(\{.*\})", clean, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    raise ValueError(f"Could not parse valid JSON from text: {clean[:80]}")


def get_llm(temperature: float = 0.2):
    """
    Factory to obtain configured LLM.
    1. 'openai' via DirectOpenAILLM using installed openai SDK
    2. 'gemini' via langchain_google_genai (if available)
    3. 'mock' as offline testing fallback
    """
    provider = settings.llm_provider.lower()

    if provider == "openai" and settings.openai_api_key and settings.openai_api_key.strip():
        try:
            return DirectOpenAILLM(
                model_name=settings.llm_model or "gpt-4o-mini",
                api_key=settings.openai_api_key.strip(),
                base_url=settings.clean_openai_base_url,
                temperature=temperature,
                timeout=12.0,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}. Falling back to mock.")
            status_tracker.record_failure(e)

    elif provider == "gemini" and settings.google_api_key and settings.google_api_key.strip():
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=settings.llm_model or "gemini-1.5-flash",
                google_api_key=settings.google_api_key.strip(),
                temperature=temperature,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini client: {e}. Falling back to mock.")
            status_tracker.record_failure(e)

    return MockLLM()


def parse_structured_output(llm: Any, prompt_text: str, pydantic_cls: Type[T], fallback_data: dict) -> T:
    """
    Invokes LLM and safely parses structured JSON matching pydantic_cls.
    If the circuit breaker is open, or if an API exception occurs (401, 429, timeout, connection drop),
    it immediately returns validated pydantic_cls(**fallback_data) without crashing or hanging.
    """
    # Fast path: Mock LLM or Circuit Breaker active
    if isinstance(llm, MockLLM) or status_tracker.should_bypass_network() or not hasattr(llm, "invoke"):
        return pydantic_cls(**fallback_data)

    schema_json = json.dumps(pydantic_cls.model_json_schema(), indent=2)
    json_instruction = (
        f"\n\nReturn strictly a valid JSON object matching this schema:\n"
        f"{schema_json}\n"
        "Do not include any introductory remarks, markdown formatting, or text outside the JSON."
    )

    # 1. Try DirectOpenAILLM with native JSON response mode
    if isinstance(llm, DirectOpenAILLM):
        try:
            raw_json = llm.invoke_json(prompt_text + json_instruction)
            data = parse_json_from_llm(raw_json)
            result = pydantic_cls(**data)
            status_tracker.record_success()
            return result
        except Exception as e:
            status_tracker.record_failure(e)
            logger.warning(f"[LLM FALLBACK ENGAGED] DirectOpenAI failed: {e}. Returning validated heuristic fallback.")
            return pydantic_cls(**fallback_data)

    # 2. Try LangChain structured output if available
    if hasattr(llm, "with_structured_output"):
        try:
            structured_model = llm.with_structured_output(pydantic_cls, method="function_calling")
            result = structured_model.invoke(prompt_text)
            if isinstance(result, pydantic_cls):
                status_tracker.record_success()
                return result
            elif isinstance(result, dict):
                inst = pydantic_cls(**result)
                status_tracker.record_success()
                return inst
        except Exception as e:
            logger.info(f"Structured output with function calling failed: {e}. Trying prompt injection.")

    # 3. Generic prompt injection fallback for standard LLM wrappers
    try:
        response = llm.invoke(prompt_text + json_instruction)
        content = response.content if hasattr(response, "content") else str(response)
        data = parse_json_from_llm(content)
        result = pydantic_cls(**data)
        status_tracker.record_success()
        return result
    except Exception as e:
        status_tracker.record_failure(e)
        logger.warning(f"[LLM FALLBACK ENGAGED] Structured output parsing failed ({e}). Returning heuristic fallback.")
        return pydantic_cls(**fallback_data)


def verify_llm_connection() -> Dict[str, Any]:
    """Probes the LLM provider with a fast 1-token query to verify credentials and endpoint health."""
    provider = settings.llm_provider.lower()

    if provider == "mock":
        status_tracker.record_success()
        return status_tracker.to_dict()

    if provider == "openai":
        if not settings.openai_api_key or not settings.openai_api_key.strip():
            status_tracker.record_failure(ValueError("OpenAI API Key is missing or empty in .env"))
            return status_tracker.to_dict()

        try:
            from openai import OpenAI
            kwargs = {"api_key": settings.openai_api_key.strip(), "timeout": 5.0}
            if settings.openai_base_url and settings.openai_base_url.strip():
                kwargs["base_url"] = settings.openai_base_url.strip()
            client = OpenAI(**kwargs)
            client.chat.completions.create(
                model=settings.llm_model or "gpt-4o-mini",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=2,
            )
            status_tracker.record_success()
            return status_tracker.to_dict()
        except Exception as e:
            status_tracker.record_failure(e)
            return status_tracker.to_dict()

    elif provider == "gemini":
        if not settings.google_api_key or not settings.google_api_key.strip():
            status_tracker.record_failure(ValueError("Google API Key is missing or empty in .env"))
            return status_tracker.to_dict()
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model=settings.llm_model or "gemini-1.5-flash",
                google_api_key=settings.google_api_key.strip(),
            )
            llm.invoke("ping")
            status_tracker.record_success()
            return status_tracker.to_dict()
        except Exception as e:
            status_tracker.record_failure(e)
            return status_tracker.to_dict()

    return status_tracker.to_dict()
