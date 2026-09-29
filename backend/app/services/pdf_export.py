"""
PDF Export Service.

Generates professional assessment report PDFs using ReportLab,
including scores, radar charts, feedback, and peer benchmarking.
"""

import io
import json
import math
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.graphics.shapes import Drawing, Circle, Line, Polygon, String
from reportlab.graphics import renderPDF

from app.models.entities import (
    InterviewSession, CandidateResponse, CandidateProfile,
    CoachingFeedback,
)

logger = logging.getLogger(__name__)

# Color palette
BRAND_BLUE = colors.HexColor("#0A84FF")
BRAND_GREEN = colors.HexColor("#30D158")
BRAND_ORANGE = colors.HexColor("#FF9F0A")
BRAND_RED = colors.HexColor("#FF453A")
DARK_BG = colors.HexColor("#1C1C1E")
GRAY_TEXT = colors.HexColor("#636366")
WHITE = colors.white


def _get_grade(score: float) -> tuple:
    """Return grade label and color based on score."""
    if score >= 85:
        return "Excellent", BRAND_GREEN
    elif score >= 70:
        return "Good", BRAND_BLUE
    elif score >= 55:
        return "Developing", BRAND_ORANGE
    else:
        return "Needs Work", BRAND_RED


def _build_radar_chart(dimensions: Dict[str, float], width: int = 300, height: int = 300) -> Drawing:
    """Create a simple radar/spider chart as a ReportLab Drawing."""
    d = Drawing(width, height)
    cx, cy = width / 2, height / 2
    radius = min(width, height) / 2 - 40

    labels = list(dimensions.keys())
    values = list(dimensions.values())
    n = len(labels)

    if n < 3:
        # Not enough dimensions for a radar chart, show a simple bar representation
        for i, (label, value) in enumerate(zip(labels, values)):
            y = cy + 30 - i * 40
            d.add(String(10, y + 5, label, fontSize=9, fillColor=colors.black))
            # Background bar
            from reportlab.graphics.shapes import Rect
            d.add(Rect(120, y, 150, 15, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
            # Value bar
            bar_width = (value / 10) * 150
            d.add(Rect(120, y, bar_width, 15, fillColor=BRAND_BLUE, strokeColor=None))
            d.add(String(275, y + 3, f"{value:.1f}/10", fontSize=8, fillColor=colors.black))
        return d

    angle_step = 2 * math.pi / n

    # Draw concentric guide circles
    for level in [0.25, 0.5, 0.75, 1.0]:
        r = radius * level
        # Approximate circle with polygon
        pts = []
        for i in range(n):
            angle = -math.pi / 2 + i * angle_step
            pts.append(cx + r * math.cos(angle))
            pts.append(cy + r * math.sin(angle))
        d.add(Polygon(pts, fillColor=None, strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))

    # Draw axis lines
    for i in range(n):
        angle = -math.pi / 2 + i * angle_step
        x2 = cx + radius * math.cos(angle)
        y2 = cy + radius * math.sin(angle)
        d.add(Line(cx, cy, x2, y2, strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))

    # Draw data polygon (scale values from 0-10 to 0-1)
    data_pts = []
    for i in range(n):
        angle = -math.pi / 2 + i * angle_step
        val_ratio = min(values[i] / 10.0, 1.0)
        data_pts.append(cx + radius * val_ratio * math.cos(angle))
        data_pts.append(cy + radius * val_ratio * math.sin(angle))

    d.add(Polygon(
        data_pts,
        fillColor=colors.HexColor("#0A84FF40"),
        strokeColor=BRAND_BLUE,
        strokeWidth=2,
    ))

    # Draw data points and labels
    for i in range(n):
        angle = -math.pi / 2 + i * angle_step
        val_ratio = min(values[i] / 10.0, 1.0)
        px = cx + radius * val_ratio * math.cos(angle)
        py = cy + radius * val_ratio * math.sin(angle)
        d.add(Circle(px, py, 3, fillColor=BRAND_BLUE, strokeColor=WHITE, strokeWidth=1))

        # Label position (outside the chart)
        lx = cx + (radius + 25) * math.cos(angle)
        ly = cy + (radius + 25) * math.sin(angle)
        label_text = f"{labels[i]} ({values[i]:.1f})"
        d.add(String(lx - 30, ly - 4, label_text, fontSize=7, fillColor=colors.black))

    return d


def generate_assessment_pdf(session_id: str, db: Session) -> bytes:
    """Generate a full assessment PDF for a single interview session."""
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")

    candidate = session.candidate
    responses = session.responses

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "BrandTitle",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#1C1C1E"),
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=BRAND_BLUE,
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#636366"),
    ))
    styles.add(ParagraphStyle(
        "BodyText2",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
    ))

    elements = []

    # ===== HEADER =====
    elements.append(Paragraph("Prepzo Assessment Report", styles["BrandTitle"]))
    elements.append(Paragraph(
        f"AI-Powered Interview Evaluation Dossier",
        styles["MetaText"],
    ))
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE))
    elements.append(Spacer(1, 12))

    # ===== CANDIDATE INFO =====
    if candidate:
        info_data = [
            ["Candidate", candidate.name or "—"],
            ["Target Role", session.target_role or "—"],
            ["Mode", session.mode or "—"],
            ["Difficulty", session.difficulty or "—"],
            ["Questions Answered", str(len(responses))],
        ]
        info_table = Table(info_data, colWidths=[120, 350])
        info_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (0, 0), (0, -1), BRAND_BLUE),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 16))

    # ===== PER-QUESTION BREAKDOWN =====
    for idx, resp in enumerate(responses):
        elements.append(Paragraph(f"Question {idx + 1}", styles["SectionHeader"]))
        elements.append(Paragraph(f"<b>Q:</b> {resp.question_text}", styles["BodyText2"]))
        elements.append(Spacer(1, 4))

        # Truncate long responses for PDF readability
        answer_text = resp.response_text or ""
        if len(answer_text) > 600:
            answer_text = answer_text[:600] + "..."
        elements.append(Paragraph(f"<b>A:</b> {answer_text}", styles["BodyText2"]))
        elements.append(Spacer(1, 8))

        # Scores table
        scores = []
        radar_dims = {}

        if resp.communication_evaluation:
            ce = resp.communication_evaluation
            scores.append(["Clarity", f"{ce.clarity_score}/10"])
            scores.append(["Conciseness", f"{ce.conciseness_score}/10"])
            scores.append(["Structure", f"{ce.structure_score}/10"])
            scores.append(["Communication Quality", f"{ce.communication_quality_score}/10"])
            radar_dims["Clarity"] = ce.clarity_score
            radar_dims["Conciseness"] = ce.conciseness_score
            radar_dims["Structure"] = ce.structure_score

        if resp.content_evaluation:
            cte = resp.content_evaluation
            scores.append(["Relevance", f"{cte.relevance_score}/10"])
            scores.append(["Correctness", f"{cte.correctness_score}/10"])
            scores.append(["Completeness", f"{cte.completeness_score}/10"])
            scores.append(["Technical Depth", f"{cte.technical_depth_score}/10"])
            radar_dims["Relevance"] = cte.relevance_score
            radar_dims["Tech Depth"] = cte.technical_depth_score

        if resp.star_evaluation and resp.star_evaluation.applicable:
            se = resp.star_evaluation
            scores.append(["Situation (STAR)", f"{se.situation_score}/10"])
            scores.append(["Task (STAR)", f"{se.task_score}/10"])
            scores.append(["Action (STAR)", f"{se.action_score}/10"])
            scores.append(["Result (STAR)", f"{se.result_score}/10"])
            radar_dims["STAR"] = (se.situation_score + se.task_score + se.action_score + se.result_score) / 4

        if scores:
            score_table = Table(scores, colWidths=[200, 80])
            score_table.setStyle(TableStyle([
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E5EA")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F2F7")),
            ]))
            elements.append(score_table)
            elements.append(Spacer(1, 8))

        # Radar chart for this question
        if len(radar_dims) >= 3:
            chart = _build_radar_chart(radar_dims)
            elements.append(chart)
            elements.append(Spacer(1, 8))

        # Coaching feedback
        if resp.coaching_feedback:
            fb = resp.coaching_feedback
            grade_label, grade_color = _get_grade(fb.overall_score or 0)
            elements.append(Paragraph(
                f"<b>Overall Score:</b> {fb.overall_score:.0f}/100 — <font color='{grade_color.hexval()}'>{grade_label}</font>",
                styles["BodyText2"],
            ))

            strengths = json.loads(fb.strengths) if fb.strengths else []
            if strengths:
                elements.append(Paragraph("<b>Strengths:</b>", styles["BodyText2"]))
                for s in strengths[:3]:
                    elements.append(Paragraph(f"  • {s}", styles["BodyText2"]))

            improvements = json.loads(fb.improvement_areas) if fb.improvement_areas else []
            if improvements:
                elements.append(Paragraph("<b>Areas for Improvement:</b>", styles["BodyText2"]))
                for imp in improvements[:3]:
                    elements.append(Paragraph(f"  • {imp}", styles["BodyText2"]))

            if fb.improved_answer_structure:
                elements.append(Spacer(1, 4))
                elements.append(Paragraph("<b>Suggested Improved Answer:</b>", styles["BodyText2"]))
                improved_text = fb.improved_answer_structure
                if len(improved_text) > 500:
                    improved_text = improved_text[:500] + "..."
                elements.append(Paragraph(improved_text, styles["MetaText"]))

        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E5EA")))

    # ===== FOOTER =====
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "Generated by Prepzo — AI-Powered Interview Coaching Platform",
        styles["MetaText"],
    ))

    doc.build(elements)
    return buffer.getvalue()


def generate_dossier_pdf(candidate_id: str, db: Session) -> bytes:
    """Generate a full career dossier PDF combining all sessions."""
    candidate = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise ValueError(f"Candidate {candidate_id} not found")

    sessions = (
        db.query(InterviewSession)
        .filter_by(candidate_id=candidate_id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("BrandTitle", parent=styles["Title"], fontSize=22, textColor=colors.HexColor("#1C1C1E")))
    styles.add(ParagraphStyle("SectionHeader", parent=styles["Heading2"], fontSize=14, textColor=BRAND_BLUE, spaceBefore=14))
    styles.add(ParagraphStyle("MetaText", parent=styles["Normal"], fontSize=9, textColor=GRAY_TEXT))
    styles.add(ParagraphStyle("BodyText2", parent=styles["Normal"], fontSize=10, leading=14))

    elements = []

    # Header
    elements.append(Paragraph(f"Executive Career Dossier — {candidate.name}", styles["BrandTitle"]))
    elements.append(Paragraph(f"Target Role: {candidate.target_role} • {len(sessions)} Sessions Completed", styles["MetaText"]))
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE))
    elements.append(Spacer(1, 16))

    # Session summary table
    if sessions:
        session_rows = [["Session", "Mode", "Role", "Difficulty", "Questions", "Status"]]
        for i, sess in enumerate(sessions):
            session_rows.append([
                f"#{i + 1}",
                sess.mode or "—",
                sess.target_role or "—",
                sess.difficulty or "—",
                str(len(sess.responses)),
                sess.status or "—",
            ])

        session_table = Table(session_rows, colWidths=[50, 90, 90, 70, 70, 70])
        session_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E5EA")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(session_table)

    # Aggregate scores across all sessions
    all_scores = []
    for sess in sessions:
        for resp in sess.responses:
            if resp.coaching_feedback:
                all_scores.append(resp.coaching_feedback.overall_score or 0)

    if all_scores:
        avg = sum(all_scores) / len(all_scores)
        grade_label, _ = _get_grade(avg)
        elements.append(Spacer(1, 16))
        elements.append(Paragraph(f"<b>Career Average Score:</b> {avg:.1f}/100 ({grade_label})", styles["BodyText2"]))
        elements.append(Paragraph(f"<b>Total Responses Evaluated:</b> {len(all_scores)}", styles["BodyText2"]))
        elements.append(Paragraph(f"<b>Best Score:</b> {max(all_scores):.0f}/100", styles["BodyText2"]))

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Generated by Prepzo — AI-Powered Interview Coaching Platform", styles["MetaText"]))

    doc.build(elements)
    return buffer.getvalue()
