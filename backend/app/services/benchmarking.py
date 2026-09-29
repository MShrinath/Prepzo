"""
Benchmarking service.

Computes percentile rankings for a candidate by comparing their
evaluation scores against the aggregate population.
"""

import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.entities import CoachingFeedback, CandidateResponse, InterviewSession

logger = logging.getLogger(__name__)


def get_percentile_rankings(candidate_id: str, db: Session) -> Dict[str, Any]:
    """
    Compute percentile ranks for a candidate's average scores
    compared to all candidates in the system.
    """
    # Get all coaching feedback scores grouped by candidate
    all_feedbacks = db.query(CoachingFeedback).all()

    if not all_feedbacks:
        return {
            "candidate_id": candidate_id,
            "percentiles": {},
            "total_candidates": 0,
            "message": "Insufficient data for benchmarking",
        }

    # Group scores by candidate
    candidate_scores: Dict[str, List[float]] = {}
    for fb in all_feedbacks:
        resp = db.query(CandidateResponse).filter_by(id=fb.response_id).first()
        if resp:
            sess = db.query(InterviewSession).filter_by(session_id=resp.session_id).first()
            if sess:
                cid = sess.candidate_id
                if cid not in candidate_scores:
                    candidate_scores[cid] = []
                candidate_scores[cid].append(fb.overall_score or 0)

    if candidate_id not in candidate_scores:
        return {
            "candidate_id": candidate_id,
            "percentiles": {},
            "total_candidates": len(candidate_scores),
            "message": "No evaluation data for this candidate yet",
        }

    # Compute average per candidate
    candidate_averages = {}
    for cid, scores in candidate_scores.items():
        candidate_averages[cid] = sum(scores) / len(scores) if scores else 0

    target_avg = candidate_averages[candidate_id]
    all_avgs = sorted(candidate_averages.values())
    total = len(all_avgs)

    # Percentile: what percentage of candidates scored <= this candidate
    below_count = sum(1 for a in all_avgs if a <= target_avg)
    percentile = round((below_count / total) * 100, 1) if total > 0 else 50.0

    # Compute per-dimension percentiles
    dimension_data = _compute_dimension_percentiles(candidate_id, db)

    return {
        "candidate_id": candidate_id,
        "overall_average": round(target_avg, 1),
        "overall_percentile": percentile,
        "total_candidates": total,
        "total_responses": len(candidate_scores.get(candidate_id, [])),
        "dimensions": dimension_data,
        "cohort_stats": {
            "min": round(min(all_avgs), 1) if all_avgs else 0,
            "max": round(max(all_avgs), 1) if all_avgs else 0,
            "median": round(all_avgs[len(all_avgs) // 2], 1) if all_avgs else 0,
            "mean": round(sum(all_avgs) / len(all_avgs), 1) if all_avgs else 0,
        },
    }


def _compute_dimension_percentiles(candidate_id: str, db: Session) -> Dict[str, Any]:
    """Compute per-dimension scores for the candidate."""
    from app.models.entities import CommunicationEvaluation, ContentEvaluation, STAREvaluation

    # Get this candidate's sessions and responses
    sessions = db.query(InterviewSession).filter_by(candidate_id=candidate_id).all()
    if not sessions:
        return {}

    comm_scores = []
    content_scores = []
    star_scores = []

    for sess in sessions:
        for resp in sess.responses:
            if resp.communication_evaluation:
                ce = resp.communication_evaluation
                avg = (ce.clarity_score + ce.conciseness_score + ce.structure_score + ce.communication_quality_score) / 4
                comm_scores.append(avg)
            if resp.content_evaluation:
                cte = resp.content_evaluation
                avg = (cte.relevance_score + cte.correctness_score + cte.completeness_score + cte.technical_depth_score + cte.evidence_quality_score) / 5
                content_scores.append(avg)
            if resp.star_evaluation and resp.star_evaluation.applicable:
                se = resp.star_evaluation
                avg = (se.situation_score + se.task_score + se.action_score + se.result_score) / 4
                star_scores.append(avg)

    dimensions = {}
    if comm_scores:
        dimensions["communication"] = {
            "average": round(sum(comm_scores) / len(comm_scores), 1),
            "max": round(max(comm_scores), 1),
            "label": "Communication & Clarity",
        }
    if content_scores:
        dimensions["content"] = {
            "average": round(sum(content_scores) / len(content_scores), 1),
            "max": round(max(content_scores), 1),
            "label": "Content & Technical Depth",
        }
    if star_scores:
        dimensions["star"] = {
            "average": round(sum(star_scores) / len(star_scores), 1),
            "max": round(max(star_scores), 1),
            "label": "STAR Structure",
        }

    return dimensions
