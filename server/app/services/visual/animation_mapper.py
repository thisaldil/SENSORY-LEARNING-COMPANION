"""
Animation Mapper - Rule-Based Animation Mapping
Maps conceptual actions from AI to valid animation names with fallbacks.
"""
from typing import Optional

VALID_ANIMATIONS = {
    "appear", "idle", "moveUp", "moveDown", "floatIn", "floatOut",
    "glow", "shine", "bubbleUp", "rotate", "pulse", "wave",
    "sway", "grow", "absorb", "orbit", "spin", "vibrate", "fall",
}

ANIMATION_MAP = {
    "appear": "appear", "show": "appear", "display": "appear",
    "idle": "idle", "stay": "idle", "rest": "idle", "wait": "idle",
    "move": "moveDown", "moveDown": "moveDown", "fall": "fall", "drop": "fall",
    "descend": "moveDown", "sink": "moveDown", "moveUp": "moveUp", "rise": "moveUp",
    "ascend": "moveUp", "float": "floatIn", "floatIn": "floatIn", "floatOut": "floatOut",
    "flow": "moveDown", "flowDown": "moveDown", "flowUp": "moveUp",
    "rotate": "rotate", "spin": "spin", "turn": "rotate", "revolve": "orbit", "orbit": "orbit",
    "pulse": "pulse", "beat": "pulse", "throb": "pulse", "glow": "glow", "shine": "shine",
    "brighten": "glow", "light": "glow", "grow": "grow", "expand": "grow", "enlarge": "grow",
    "shrink": "pulse", "wave": "wave", "sway": "sway", "swing": "sway",
    "vibrate": "vibrate", "shake": "vibrate", "bubbleUp": "bubbleUp", "bubble": "bubbleUp",
    "absorb": "absorb", "take": "absorb", "collect": "absorb",
    "erupt": "pulse", "erosion": "pulse", "erode": "pulse", "weather": "pulse",
    "rain": "moveDown", "rainDown": "moveDown", "snow": "fall",
    "melt": "bubbleUp", "solidify": "appear", "harden": "appear", "cool": "appear", "pile": "grow",
    "photosynthesize": "glow", "breathe": "pulse", "digest": "absorb",
    "react": "pulse", "combine": "pulse", "split": "pulse", "bond": "pulse", "break": "pulse",
}


def map_animation(conceptual_action: str) -> str:
    """Map a conceptual action to a valid animation name."""
    if not conceptual_action:
        return "idle"
    normalized = conceptual_action.lower().strip()
    if normalized in ANIMATION_MAP:
        mapped = ANIMATION_MAP[normalized]
        if mapped in VALID_ANIMATIONS:
            return mapped
        return "idle"
    for key, value in ANIMATION_MAP.items():
        if key in normalized or normalized in key:
            if value in VALID_ANIMATIONS:
                return value
    return "idle"


def validate_animation(animation_name: str) -> bool:
    """Check if an animation name is valid."""
    return animation_name in VALID_ANIMATIONS


def get_animation_fallback(animation_name: str) -> str:
    """Get a fallback animation if the requested one doesn't exist."""
    if animation_name in VALID_ANIMATIONS:
        return animation_name
    if "move" in animation_name.lower() or "flow" in animation_name.lower():
        return "moveDown"
    if "grow" in animation_name.lower() or "expand" in animation_name.lower():
        return "grow"
    if "rotate" in animation_name.lower() or "spin" in animation_name.lower():
        return "rotate"
    if "pulse" in animation_name.lower() or "beat" in animation_name.lower():
        return "pulse"
    return "idle"
