"""
Activities API Routes – Concept Playground (MongoDB)
"""
import re
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.models.activity import Activity

router = APIRouter()

# Valid filter values (uppercase for comparison)
COGNITIVE_LOAD_VALUES = {"LOW", "MEDIUM", "HIGH"}
ACTIVITY_TYPE_VALUES = {"TRUE_FALSE", "MCQ", "MATCHING", "FILL_BLANK_WORD_BANK"}


def _activity_to_response(activity: Activity) -> dict:
    """Convert Activity document to API response dict."""
    data = activity.model_dump(mode="json")
    data["id"] = str(activity.id)
    data.pop("_id", None)
    return data


def build_activity_query(
    topic: Optional[str] = None,
    topics_any: Optional[list] = None,
    cognitive_load: Optional[str] = None,
    activity_type: Optional[str] = None,
) -> dict:
    """Build MongoDB query for activities. topics_any = list of strings for $or regex match."""
    query: dict = {}
    if topic is not None and topic.strip():
        query["topic"] = topic.strip()
    elif topics_any:
        or_clauses = [{"topic": {"$regex": re.escape(t), "$options": "i"}} for t in topics_any if t and str(t).strip()]
        if or_clauses:
            query["$or"] = or_clauses
    if cognitive_load is not None and cognitive_load.strip():
        cl = cognitive_load.strip().upper()
        if cl in COGNITIVE_LOAD_VALUES:
            query["cognitive_load"] = cl
    if activity_type is not None and activity_type.strip():
        at = activity_type.strip().upper()
        if at in ACTIVITY_TYPE_VALUES:
            query["activity_type"] = at
    return query


@router.get("", response_class=JSONResponse)
async def get_activities(
    topic: Optional[str] = Query(None, description="Filter by topic (e.g. 'Characteristics of Living Organisms')"),
    cognitive_load: Optional[str] = Query(
        None,
        description="Filter by cognitive load: LOW, MEDIUM, or HIGH",
    ),
    activity_type: Optional[str] = Query(
        None,
        description="Filter by type: TRUE_FALSE, MCQ, MATCHING, or FILL_BLANK_WORD_BANK",
    ),
):
    """
    Get learning activities for the Concept Playground.

    Returns a JSON array of activities from the MongoDB `activities` collection.
    Optionally filter by topic, cognitive_load, and/or activity_type.
    If no query params are sent, returns all activities.
    """
    query = build_activity_query(topic=topic, cognitive_load=cognitive_load, activity_type=activity_type)
    cursor = Activity.find(query)
    activities = await cursor.to_list()
    result = [_activity_to_response(a) for a in activities]
    return JSONResponse(content=result, media_type="application/json")
