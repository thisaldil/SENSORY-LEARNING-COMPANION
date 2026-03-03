"""
Content Service – Adaptive Content Mapping
"""
from typing import Optional

from beanie import PydanticObjectId

from app.models.content import ContentObject


async def get_content_for_state(
    lesson_id: PydanticObjectId,
    state: str,
    concept_id: Optional[str] = None,
) -> Optional[dict]:
    """
    Return the appropriate content JSON variant for the given load state.

    State is a discrete label: "LOW", "OPTIMAL", or "OVERLOAD".
    """
    query = {"lesson_id": lesson_id}
    if concept_id:
        query["concept_id"] = concept_id

    content_obj = await ContentObject.find_one(
        ContentObject.lesson_id == lesson_id,
        ContentObject.concept_id == concept_id if concept_id else True,
    )
    if not content_obj:
        return None

    normalized = (state or "").upper()
    if normalized == "LOW":
        return content_obj.low_load_json
    if normalized == "OVERLOAD":
        return content_obj.overload_json
    return content_obj.optimal_json

