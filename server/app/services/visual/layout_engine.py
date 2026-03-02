"""
Layout Engine - Rule-Based Position, Size, and Color Assignment
"""
from typing import Any, Optional

CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

DEFAULT_SIZES = {
    "volcano": 80, "mountain": 120, "ocean": 150, "cloud": 40,
    "earth": 60, "planet": 50, "moon": 30, "star": 25, "sun": 50, "asteroid": 20, "comet": 25,
    "plant": 100, "leaf": 35, "root": 80, "cell": 40, "bacteria": 20, "animal": 50,
    "molecule": 25, "atom": 30, "electron": 15, "proton": 20, "neutron": 20,
    "arrow": 100, "label": 16, "line": 1, "graph": 100, "number": 16,
}

DEFAULT_COLORS = {
    "volcano": "#FF5722", "mountain": "#795548", "ocean": "#2196F3", "cloud": "#E0E0E0",
    "earth": "#4A90E2", "planet": "#9E9E9E", "moon": "#E0E0E0", "star": "#FFD700", "sun": "#FFD700",
    "asteroid": "#8D6E63", "comet": "#B0BEC5",
    "plant": "#2E7D32", "leaf": "#4CAF50", "root": "#8B4513", "cell": "#E1BEE7", "bacteria": "#9C27B0", "animal": "#FF9800",
    "molecule": {"water": "#2196F3", "co2": "#757575", "o2": "#4CAF50", "magma": "#FF9800", "sediment": "#9E9E9E", "rock": "#8D6E63", "default": "#9E9E9E"},
    "atom": "#64B5F6", "electron": "#FFD700", "proton": "#F44336", "neutron": "#9E9E9E",
    "arrow": "#FF5722", "label": "#000000", "line": "#666666", "graph": "#2196F3", "number": "#000000",
    "glucose": "#FF9800",
}

POSITION_ZONES = {
    "volcano": {"x": 600, "y": 350, "zone": "bottom-right"},
    "mountain": {"x": 400, "y": 250, "zone": "center"},
    "ocean": {"x": 200, "y": 450, "zone": "bottom-left"},
    "cloud": {"x": 300, "y": 100, "zone": "top-left"},
    "earth": {"x": 400, "y": 450, "zone": "bottom-center"},
    "planet": {"x": 200, "y": 250, "zone": "left"},
    "moon": {"x": 600, "y": 200, "zone": "top-right"},
    "star": {"x": 700, "y": 80, "zone": "top-right"},
    "sun": {"x": 700, "y": 80, "zone": "top-right"},
    "asteroid": {"x": 100, "y": 150, "zone": "top-left"},
    "comet": {"x": 100, "y": 200, "zone": "top-left"},
    "plant": {"x": 400, "y": 350, "zone": "center"},
    "leaf": {"x": 400, "y": 200, "zone": "top-center"},
    "root": {"x": 400, "y": 550, "zone": "bottom-center"},
    "cell": {"x": 400, "y": 300, "zone": "center"},
    "bacteria": {"x": 400, "y": 300, "zone": "center"},
    "animal": {"x": 400, "y": 300, "zone": "center"},
    "molecule": {"x": 400, "y": 300, "zone": "center"},
    "atom": {"x": 400, "y": 300, "zone": "center"},
    "electron": {"x": 400, "y": 300, "zone": "center"},
    "proton": {"x": 400, "y": 300, "zone": "center"},
    "neutron": {"x": 400, "y": 300, "zone": "center"},
    "arrow": {"x": 400, "y": 300, "zone": "center"},
    "label": {"x": 400, "y": 300, "zone": "center"},
    "line": {"x": 400, "y": 300, "zone": "center"},
    "graph": {"x": 400, "y": 300, "zone": "center"},
    "number": {"x": 400, "y": 300, "zone": "center"},
}


def get_color(actor_type: str, context: Optional[dict] = None) -> str:
    """Get color for actor type, considering context (e.g. moleculeType)."""
    context = context or {}
    if actor_type == "molecule" and context.get("moleculeType"):
        mt = context["moleculeType"]
        mol_colors = DEFAULT_COLORS.get("molecule", {})
        if isinstance(mol_colors, dict):
            return mol_colors.get(mt, mol_colors.get("default", "#9E9E9E"))
    color = DEFAULT_COLORS.get(actor_type)
    if isinstance(color, dict):
        return color.get("default", "#9E9E9E")
    return color or "#9E9E9E"


def place_actor(actor_type: str, actor_index: int = 0, total_actors: int = 1, scene_context: Optional[dict] = None) -> dict:
    """Assign position, size, and color. Returns { x, y, size, color }."""
    context = scene_context or {}
    base_pos = POSITION_ZONES.get(actor_type, {"x": 400, "y": 300, "zone": "center"})
    x, y = base_pos["x"], base_pos["y"]
    if total_actors > 1:
        spacing = 120
        offset = (actor_index - (total_actors - 1) / 2) * spacing
        x = base_pos["x"] + offset
        if actor_type in ["molecule", "atom", "electron", "proton", "neutron"]:
            y = base_pos["y"] + (actor_index % 3) * 40
    size = DEFAULT_SIZES.get(actor_type, 40)
    color = get_color(actor_type, context)
    return {"x": int(x), "y": int(y), "size": size, "color": color}


def get_actor_properties(actor_type: str, context: Optional[dict] = None) -> dict:
    """Get all default properties for an actor type."""
    context = context or {}
    placement = place_actor(actor_type, 0, 1, context)
    props = {"x": placement["x"], "y": placement["y"], "size": placement["size"], "color": placement["color"]}
    if actor_type == "leaf":
        props["angle"] = 0
    elif actor_type == "root":
        props["depth"] = 80
        props["width"] = 100
        props["branches"] = 6
    elif actor_type == "molecule" and context.get("moleculeType"):
        props["moleculeType"] = context["moleculeType"]
    elif actor_type == "cell":
        props["cellType"] = context.get("cellType", "plant")
        props["showLabels"] = True
    elif actor_type == "sun":
        props["rays"] = True
    elif actor_type == "arrow":
        props["length"] = 100
        props["angle"] = 0
        props["thickness"] = 2
    elif actor_type in ("label", "number"):
        props["fontSize"] = 16
        props["text"] = context.get("text", "")
    return props
