"""
Actor Mapper - Rule-Based Actor Type Mapping
Maps conceptual actor names from AI to actual actor types in the frontend registry.
"""
from typing import Optional

# Complete actor mapping from conceptual names to actual actor types
ACTOR_MAP = {
    # ===== Earth/Environment =====
    "volcano": {"type": "volcano", "category": "earth"},
    "mountain": {"type": "mountain", "category": "earth"},
    "ocean": {"type": "ocean", "category": "earth"},
    "cloud": {"type": "cloud", "category": "earth"},
    "mountains": {"type": "mountain", "category": "earth"},
    "volcanoes": {"type": "volcano", "category": "earth"},
    "oceans": {"type": "ocean", "category": "earth"},
    "clouds": {"type": "cloud", "category": "earth"},
    # ===== Astronomy =====
    "earth": {"type": "earth", "category": "astronomy"},
    "planet": {"type": "planet", "category": "astronomy"},
    "moon": {"type": "moon", "category": "astronomy"},
    "star": {"type": "star", "category": "astronomy"},
    "sun": {"type": "sun", "category": "astronomy"},
    "asteroid": {"type": "asteroid", "category": "astronomy"},
    "comet": {"type": "comet", "category": "astronomy"},
    "planets": {"type": "planet", "category": "astronomy"},
    "stars": {"type": "star", "category": "astronomy"},
    "sunlight": {"type": "sun", "category": "astronomy"},
    # ===== Biology =====
    "plant": {"type": "plant", "category": "biology", "legacy": True},
    "plants": {"type": "plant", "category": "biology", "legacy": True},
    "leaf": {"type": "leaf", "category": "biology"},
    "leaves": {"type": "leaf", "category": "biology"},
    "root": {"type": "root", "category": "biology"},
    "roots": {"type": "root", "category": "biology"},
    "cell": {"type": "cell", "category": "biology"},
    "cells": {"type": "cell", "category": "biology"},
    "bacteria": {"type": "bacteria", "category": "biology"},
    "animal": {"type": "animal", "category": "biology"},
    "animals": {"type": "animal", "category": "biology"},
    # ===== Chemistry/Physics (using molecules for abstract concepts) =====
    "magma": {"type": "molecule", "moleculeType": "magma", "category": "chemistry"},
    "sediment": {"type": "molecule", "moleculeType": "sediment", "category": "chemistry"},
    "sediments": {"type": "molecule", "moleculeType": "sediment", "category": "chemistry"},
    "rock": {"type": "molecule", "moleculeType": "rock", "category": "chemistry"},
    "rocks": {"type": "molecule", "moleculeType": "rock", "category": "chemistry"},
    "water": {"type": "molecule", "moleculeType": "water", "category": "chemistry"},
    "h2o": {"type": "molecule", "moleculeType": "water", "category": "chemistry"},
    "co2": {"type": "molecule", "moleculeType": "co2", "category": "chemistry"},
    "oxygen": {"type": "molecule", "moleculeType": "o2", "category": "chemistry"},
    "o2": {"type": "molecule", "moleculeType": "o2", "category": "chemistry"},
    "glucose": {"type": "glucose", "category": "chemistry", "legacy": True},
    "atom": {"type": "atom", "category": "chemistry"},
    "atoms": {"type": "atom", "category": "chemistry"},
    "molecule": {"type": "molecule", "category": "chemistry"},
    "molecules": {"type": "molecule", "category": "chemistry"},
    "electron": {"type": "electron", "category": "chemistry"},
    "electrons": {"type": "electron", "category": "chemistry"},
    "proton": {"type": "proton", "category": "chemistry"},
    "protons": {"type": "proton", "category": "chemistry"},
    "neutron": {"type": "neutron", "category": "chemistry"},
    "neutrons": {"type": "neutron", "category": "chemistry"},
    # ===== Visual Aids =====
    "arrow": {"type": "arrow", "category": "visual"},
    "arrows": {"type": "arrow", "category": "visual"},
    "label": {"type": "label", "category": "visual"},
    "labels": {"type": "label", "category": "visual"},
    "line": {"type": "line", "category": "visual"},
    "lines": {"type": "line", "category": "visual"},
    "graph": {"type": "graph", "category": "visual"},
    "number": {"type": "number", "category": "visual"},
    "numbers": {"type": "number", "category": "visual"},
}

VALID_ACTOR_TYPES = {
    "planet", "earth", "moon", "star", "sun", "asteroid", "comet",
    "cloud", "mountain", "ocean", "volcano",
    "animal", "cell", "bacteria", "leaf", "root",
    "molecule", "atom", "electron", "proton", "neutron",
    "arrow", "label", "line", "graph", "number",
    "plant", "glucose",
}


def map_actor(conceptual_name: str) -> Optional[dict]:
    """
    Map a conceptual actor name (from AI) to actual actor configuration.
    Returns dict with type, category, moleculeType (if applicable), or None.
    """
    if not conceptual_name:
        return None
    normalized = conceptual_name.lower().strip()
    if normalized in ACTOR_MAP:
        return ACTOR_MAP[normalized].copy()
    if normalized.endswith("s") and normalized[:-1] in ACTOR_MAP:
        return ACTOR_MAP[normalized[:-1]].copy()
    if normalized + "s" in ACTOR_MAP:
        return ACTOR_MAP[normalized + "s"].copy()
    for key, value in ACTOR_MAP.items():
        if key in normalized or normalized in key:
            return value.copy()
    if "rock" in normalized or "stone" in normalized:
        return {"type": "molecule", "moleculeType": "rock", "category": "chemistry"}
    if "water" in normalized or "h2o" in normalized:
        return {"type": "molecule", "moleculeType": "water", "category": "chemistry"}
    if "magma" in normalized or "lava" in normalized:
        return {"type": "molecule", "moleculeType": "magma", "category": "chemistry"}
    if "sediment" in normalized or "sand" in normalized:
        return {"type": "molecule", "moleculeType": "sediment", "category": "chemistry"}
    print(f"⚠️ Warning: Could not map actor '{conceptual_name}' to known type")
    return None


def validate_actor_type(actor_type: str) -> bool:
    """Check if an actor type is valid in the frontend registry."""
    return actor_type in VALID_ACTOR_TYPES


def get_actor_category(actor_type: str) -> str:
    """Get the category of an actor type."""
    for value in ACTOR_MAP.values():
        if value.get("type") == actor_type:
            return value.get("category", "unknown")
    return "unknown"
