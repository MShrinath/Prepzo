import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_architecture_png(output_path="docs/architecture.png"):
    width, height = 1200, 900
    img = Image.new("RGB", (width, height), color=(15, 23, 42)) # Slate 900
    draw = ImageDraw.Draw(img)

    # Header
    draw.text((width // 2 - 320, 30), "AI COMMUNICATION & INTERVIEW COACHING SYSTEM", fill=(255, 255, 255))
    draw.text((width // 2 - 280, 55), "LangGraph Multi-Agent Architecture with 3-Mode Routing", fill=(148, 163, 184))

    # Candidate Box
    draw.rectangle([450, 90, 750, 140], fill=(30, 41, 59), outline=(99, 102, 241), width=2)
    draw.text((490, 105), "CANDIDATE: React + Vite UI", fill=(255, 255, 255))

    # Arrow
    draw.line([(600, 140), (600, 170)], fill=(148, 163, 184), width=2)

    # FastAPI Box
    draw.rectangle([400, 170, 800, 220], fill=(30, 41, 59), outline=(56, 189, 248), width=2)
    draw.text((440, 185), "FastAPI REST API & Whisper STT Service", fill=(255, 255, 255))

    # Arrow
    draw.line([(600, 220), (600, 250)], fill=(148, 163, 184), width=2)

    # 3 Entry Modes
    draw.rectangle([100, 260, 380, 310], fill=(49, 46, 129), outline=(99, 102, 241), width=2)
    draw.text((120, 275), "Mode 1: Role Practice (9 Roles)", fill=(255, 255, 255))

    draw.rectangle([450, 260, 750, 310], fill=(6, 78, 59), outline=(16, 185, 129), width=2)
    draw.text((470, 275), "Mode 2: Resume + JD Gap Analysis", fill=(255, 255, 255))

    draw.rectangle([820, 260, 1100, 310], fill=(120, 53, 15), outline=(245, 158, 11), width=2)
    draw.text((840, 275), "Mode 3: HR Behavioral Round", fill=(255, 255, 255))

    # Connect to LangGraph
    draw.line([(240, 310), (240, 340), (600, 340)], fill=(148, 163, 184), width=2)
    draw.line([(600, 310), (600, 350)], fill=(148, 163, 184), width=2)
    draw.line([(960, 310), (960, 340), (600, 340)], fill=(148, 163, 184), width=2)

    # LangGraph Main Box
    draw.rectangle([80, 360, 1120, 680], fill=(15, 23, 42), outline=(99, 102, 241), width=3)
    draw.text((100, 375), "LANGGRAPH MULTI-AGENT STATE MACHINE (InterviewState)", fill=(129, 140, 248))

    # Agents
    # QAgent
    draw.rectangle([110, 420, 310, 510], fill=(30, 41, 59), outline=(56, 189, 248), width=2)
    draw.text((130, 440), "QUESTION AGENT", fill=(56, 189, 248))
    draw.text((130, 465), "Role & Gap Matching", fill=(148, 163, 184))
    draw.text((130, 485), "Resume Grounding", fill=(148, 163, 184))

    # CommAgent
    draw.rectangle([340, 420, 540, 510], fill=(30, 41, 59), outline=(129, 140, 248), width=2)
    draw.text((360, 440), "COMMUNICATION", fill=(129, 140, 248))
    draw.text((360, 465), "Clarity & Conciseness", fill=(148, 163, 184))
    draw.text((360, 485), "Filler Word Penalties", fill=(148, 163, 184))

    # ContentAgent
    draw.rectangle([570, 420, 770, 510], fill=(30, 41, 59), outline=(52, 211, 153), width=2)
    draw.text((590, 440), "CONTENT AGENT", fill=(52, 211, 153))
    draw.text((590, 465), "Relevance & Correctness", fill=(148, 163, 184))
    draw.text((590, 485), "Technical Depth Check", fill=(148, 163, 184))

    # STARAgent
    draw.rectangle([800, 420, 1000, 510], fill=(30, 41, 59), outline=(251, 191, 36), width=2)
    draw.text((820, 440), "STAR AGENT", fill=(251, 191, 36))
    draw.text((820, 465), "Situation, Task, Action", fill=(148, 163, 184))
    draw.text((820, 485), "Result Metric Validation", fill=(148, 163, 184))

    # Router
    draw.rectangle([1020, 445, 1100, 485], fill=(51, 65, 85), outline=(148, 163, 184), width=1)
    draw.text((1035, 460), "Router", fill=(255, 255, 255))

    # Coach Agent
    draw.rectangle([250, 560, 950, 640], fill=(67, 56, 202), outline=(199, 210, 254), width=2)
    draw.text((320, 580), "INTERVIEW COACH AGENT (Holistic Synthesis)", fill=(255, 255, 255))
    draw.text((275, 605), "Balanced Scoring &bull; Evidence Quotes &bull; Follow-Up Generation &bull; 7-Day Plan", fill=(224, 231, 255))

    # Persistence Layer
    draw.rectangle([80, 710, 1120, 840], fill=(19, 30, 50), outline=(51, 65, 85), width=2)
    draw.text((100, 725), "PERSISTENCE & LONGITUDINAL ANALYTICS", fill=(148, 163, 184))

    draw.rectangle([100, 750, 320, 810], fill=(30, 41, 59), outline=(71, 85, 105), width=1)
    draw.text((120, 775), "PostgreSQL / SQLite", fill=(255, 255, 255))

    draw.rectangle([350, 750, 570, 810], fill=(30, 41, 59), outline=(71, 85, 105), width=1)
    draw.text((370, 775), "Recurring Weakness Index", fill=(255, 255, 255))

    draw.rectangle([600, 750, 820, 810], fill=(30, 41, 59), outline=(71, 85, 105), width=1)
    draw.text((620, 775), "Personalized 7-Day Plan", fill=(255, 255, 255))

    draw.rectangle([850, 750, 1100, 810], fill=(30, 41, 59), outline=(71, 85, 105), width=1)
    draw.text((870, 775), "Recharts Longitudinal Trends", fill=(255, 255, 255))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Generated {output_path}")

def generate_architecture_pdf(png_path="docs/architecture.png", output_pdf="docs/architecture.pdf"):
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#4f46e5'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    story = []

    story.append(Paragraph("AI-Powered Communication & Interview Coaching System", title_style))
    story.append(Paragraph("Comprehensive System Architecture & Multi-Agent Design Document", subtitle_style))

    # Embed the high-res diagram
    if os.path.exists(png_path):
        story.append(RLImage(png_path, width=540, height=360))
        story.append(Spacer(1, 12))

    story.append(Paragraph("1. Architectural Overview & Workflow", heading_style))
    story.append(Paragraph(
        "The system utilizes LangGraph as a stateful, compiled multi-agent orchestration engine. "
        "Unlike generic single-prompt chatbots, responses are evaluated across specialized orthogonal dimensions: "
        "Communication clarity, technical content depth, and STAR behavioral structure. "
        "A conditional router triggers deeper specialist diagnostics if any core dimension scores below threshold, "
        "after which the Coach Agent performs holistic evidence-grounded synthesis.",
        body_style
    ))

    story.append(Paragraph("2. Three Core Interview Entry Modes", heading_style))
    mode_data = [
        ["Mode", "Description", "Evaluation Focus"],
        ["Mode 1: Role Practice", "Select from 9 curated preset roles (SDE, DevOps, AI/ML, PM, Sales, etc.).", "Domain concepts, system design, role-specific competencies."],
        ["Mode 2: Resume + JD", "Upload resume (PDF/TXT) and paste Job Description for automated gap analysis.", "Strict resume grounding; probing undemonstrated JD skills."],
        ["Mode 3: HR Round", "Curated behavioral tracks (Conflict, Feedback, Stress, Failure, Motivation).", "Interpersonal communication, radical empathy, STAR structure."]
    ]
    t = Table(mode_data, colWidths=[110, 240, 190])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    story.append(Paragraph("3. Scoring Rubric & Longitudinal Progress", heading_style))
    story.append(Paragraph(
        "<b>Overall Score Equation:</b> Relevance (25%) + Content Quality (25%) + Communication (20%) + Structure (15%) + Completeness (15%). "
        "Cross-session intelligence detects recurring gaps (appearing in >= 2 sessions) and generates an adaptive 7-Day Personalized Improvement Plan.",
        body_style
    ))

    doc.build(story)
    print(f"Generated {output_pdf}")

if __name__ == "__main__":
    generate_architecture_png()
    generate_architecture_pdf()
