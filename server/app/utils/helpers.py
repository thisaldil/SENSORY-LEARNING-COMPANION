"""
General Helper Functions
"""
from beanie import PydanticObjectId
from typing import Optional


def str_to_objectid(id_str: str) -> Optional[PydanticObjectId]:
    """Convert string to PydanticObjectId"""
    try:
        return PydanticObjectId(id_str)
    except Exception:
        return None


def objectid_to_str(obj_id: PydanticObjectId) -> str:
    """Convert PydanticObjectId to string"""
    return str(obj_id)

