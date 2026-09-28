import os
import json
import logging
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class MockLLM:
    """A deterministic mock LLM used when no external API key is provided or for offline testing."""
    def __init__(self, model_name: str = "mock-model"):
        self.model_name = model_name

    def invoke(self, prompt: Any) -> str:
        return "Mock LLM text response."


def get_llm(temperature: float = 0.2):
    """
    Factory to obtain configured LLM. Supports:
    1. 'gemini' via langchain-google-genai
    2. 'openai' via langchain-openai
    3. 'mock' as robust offline fallback
    """
    provider = settings.llm_provider.lower()

    if provider == "gemini" and settings.google_api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=settings.llm_model or "gemini-1.5-flash",
                google_api_key=settings.google_api_key,
                temperature=temperature,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini LLM: {e}. Falling back to mock.")

    elif provider == "openai" and settings.openai_api_key:
        try:
            from langchain_openai import ChatOpenAI
            kwargs = {
                "model": settings.llm_model or "gpt-4o-mini",
                "api_key": settings.openai_api_key,
                "temperature": temperature,
            }
            if settings.openai_base_url:
                kwargs["base_url"] = settings.openai_base_url.strip()
            return ChatOpenAI(**kwargs)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI LLM: {e}. Falling back to mock.")

    return MockLLM()


def parse_structured_output(llm: Any, prompt_text: str, pydantic_cls: Type[T], fallback_data: dict) -> T:
    """
    Invokes LLM and safely parses structured JSON matching pydantic_cls.
    Falls back gracefully to fallback_data if LLM invocation or parsing fails.
    """
    if isinstance(llm, MockLLM) or not hasattr(llm, "invoke"):
        return pydantic_cls(**fallback_data)

    try:
        # Check if structured output is natively supported
        if hasattr(llm, "with_structured_output"):
            structured_model = llm.with_structured_output(pydantic_cls)
            result = structured_model.invoke(prompt_text)
            if isinstance(result, pydantic_cls):
                return result
            elif isinstance(result, dict):
                return pydantic_cls(**result)

        # Fallback to prompt injection of JSON schema
        json_instruction = (
            f"\n\nReturn ONLY a valid JSON object strictly matching this schema:\n"
            f"{json.dumps(pydantic_cls.model_json_schema(), indent=2)}\n"
            "Do not include any markdown backticks, explanations, or extraneous text outside the JSON."
        )
        response = llm.invoke(prompt_text + json_instruction)
        content = response.content if hasattr(response, "content") else str(response)

        # Clean backticks if LLM enclosed JSON in ```json ... ```
        clean_content = content.strip()
        if clean_content.startswith("```json"):
            clean_content = clean_content[7:]
        elif clean_content.startswith("```"):
            clean_content = clean_content[3:]
        if clean_content.endswith("```"):
            clean_content = clean_content[:-3]
        clean_content = clean_content.strip()

        data = json.loads(clean_content)
        return pydantic_cls(**data)

    except Exception as e:
        logger.warning(f"Structured output parsing failed ({str(e)}). Using provided fallback.")
        return pydantic_cls(**fallback_data)
