"""
Content Service – Adaptive Content Mapping
"""
from typing import Optional

from beanie import PydanticObjectId

from app.models.cognitive_load.content import ContentObject


async def get_content_for_state(
    lesson_id: PydanticObjectId,
    state: str,
    concept_id: Optional[str] = None,
) -> Optional[dict]:
    """
    Return the appropriate content JSON variant for the given load state.

    State is a discrete label: "LOW", "OPTIMAL", or "OVERLOAD".
    """
    # NOTE:
    # Older Beanie versions allowed query expressions like
    # `ContentObject.lesson_id == lesson_id`. With the current
    # Pydantic/Beanie stack this raises AttributeError on the
    # class attribute access, so we fall back to a plain dict query.
    query: dict = {"lesson_id": lesson_id}
    if concept_id is not None:
        query["concept_id"] = concept_id

    content_obj = await ContentObject.find_one(query)
    if not content_obj:
        return None

    normalized = (state or "").upper()
    if normalized == "LOW":
        return content_obj.low_load_json
    if normalized == "OVERLOAD":
        return content_obj.overload_json
    return content_obj.optimal_json

