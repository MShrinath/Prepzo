"""
Export API.

Endpoints for PDF export and peer benchmarking.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database.connection import get_db
from app.services.pdf_export import generate_assessment_pdf, generate_dossier_pdf
from app.services.benchmarking import get_percentile_rankings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Export & Benchmarking"])


@router.get("/interviews/{session_id}/export/pdf")
def export_session_pdf(session_id: str, db: Session = Depends(get_db)):
    """Generate and download a PDF assessment report for a single session."""
    try:
        pdf_bytes = generate_assessment_pdf(session_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="prepzo_assessment_{session_id}.pdf"'
        },
    )


@router.get("/candidates/{candidate_id}/dossier/pdf")
def export_dossier_pdf(candidate_id: str, db: Session = Depends(get_db)):
    """Generate and download a full career dossier PDF for a candidate."""
    try:
        pdf_bytes = generate_dossier_pdf(candidate_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Dossier PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate dossier PDF")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="prepzo_dossier_{candidate_id}.pdf"'
        },
    )


@router.get("/candidates/{candidate_id}/percentile")
def get_candidate_percentile(candidate_id: str, db: Session = Depends(get_db)):
    """Get percentile rankings for a candidate compared to the cohort."""
    return get_percentile_rankings(candidate_id, db)
