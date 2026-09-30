from typing import Dict, Any
from fastapi import APIRouter
from app.llm.provider import status_tracker, verify_llm_connection

router = APIRouter(prefix="/api/llm", tags=["LLM Health & Diagnostics"])


@router.get("/status")
def get_llm_status() -> Dict[str, Any]:
    """
    Returns the real-time health, circuit-breaker status, and operational mode of the LLM service.
    Informs frontend whether evaluations are live AI or running in offline heuristic fallback mode.
    """
    return status_tracker.to_dict()


@router.post("/verify")
def verify_llm() -> Dict[str, Any]:
    """
    Actively probes the configured LLM API (1-token test prompt) to verify credentials and connectivity.
    Closes the circuit-breaker if credentials are valid, or engages fallback mode if invalid.
    """
    return verify_llm_connection()


@router.post("/reset")
def reset_circuit_breaker() -> Dict[str, Any]:
    """
    Manually resets the circuit breaker and error counts to attempt live recovery.
    """
    status_tracker.circuit_open = False
    status_tracker.consecutive_failures = 0
    status_tracker.last_error = None
    status_tracker.last_error_type = None
    return status_tracker.to_dict()
