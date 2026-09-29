"""
STAR Story Bank API.

Manages the candidate's reusable career story bank —
a collection of their best STAR-structured answers for
future interview recall and shadowing practice.
"""

import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.entities import STARStory, CandidateProfile

router = APIRouter(prefix="/api", tags=["Story Bank"])


class StoryCreateRequest(BaseModel):
    title: str
    situation: Optional[str] = None
    task: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    tags: List[str] = []
    competency: Optional[str] = None
    source_session_id: Optional[str] = None
    source_question: Optional[str] = None
    original_response: Optional[str] = None
    improved_version: Optional[str] = None
    score: Optional[float] = None


class StoryUpdateRequest(BaseModel):
    title: Optional[str] = None
    situation: Optional[str] = None
    task: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    tags: Optional[List[str]] = None
    competency: Optional[str] = None
    improved_version: Optional[str] = None


@router.get("/candidates/{candidate_id}/stories")
def list_stories(candidate_id: str, db: Session = Depends(get_db)):
    """List all STAR stories for a candidate."""
    stories = (
        db.query(STARStory)
        .filter_by(candidate_id=candidate_id)
        .order_by(STARStory.created_at.desc())
        .all()
    )
    return {"stories": [s.to_dict() for s in stories]}


@router.post("/candidates/{candidate_id}/stories")
def create_story(candidate_id: str, req: StoryCreateRequest, db: Session = Depends(get_db)):
    """Save a new STAR story to the career brag sheet."""
    # Verify candidate exists
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    story = STARStory(
        candidate_id=candidate_id,
        title=req.title,
        situation=req.situation,
        task=req.task,
        action=req.action,
        result=req.result,
        tags=json.dumps(req.tags),
        competency=req.competency,
        source_session_id=req.source_session_id,
        source_question=req.source_question,
        original_response=req.original_response,
        improved_version=req.improved_version,
        score=req.score,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return story.to_dict()


@router.put("/candidates/{candidate_id}/stories/{story_id}")
def update_story(
    candidate_id: str,
    story_id: str,
    req: StoryUpdateRequest,
    db: Session = Depends(get_db),
):
    """Edit an existing STAR story."""
    story = db.query(STARStory).filter_by(id=story_id, candidate_id=candidate_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    if req.title is not None:
        story.title = req.title
    if req.situation is not None:
        story.situation = req.situation
    if req.task is not None:
        story.task = req.task
    if req.action is not None:
        story.action = req.action
    if req.result is not None:
        story.result = req.result
    if req.tags is not None:
        story.tags = json.dumps(req.tags)
    if req.competency is not None:
        story.competency = req.competency
    if req.improved_version is not None:
        story.improved_version = req.improved_version

    db.commit()
    db.refresh(story)
    return story.to_dict()


@router.delete("/candidates/{candidate_id}/stories/{story_id}")
def delete_story(candidate_id: str, story_id: str, db: Session = Depends(get_db)):
    """Delete a STAR story."""
    story = db.query(STARStory).filter_by(id=story_id, candidate_id=candidate_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    db.delete(story)
    db.commit()
    return {"status": "deleted", "story_id": story_id}
