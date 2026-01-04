def build_scene_graph(concepts, relations):
    """
    Build a simple scene graph from concepts and relations
    """
    nodes = []
    edges = []

    seen = set()

    for concept in concepts:
        if concept not in seen:
            nodes.append({
                "id": concept,
                "type": "concept"
            })
            seen.add(concept)

    for rel in relations:
        edges.append({
            "from": rel["subject"],
            "to": rel["object"],
            "label": rel["relation"]
        })

    return {
        "nodes": nodes,
        "edges": edges
    }
