def generate_script(relations, examples):
    if examples:
        lines = []

        for concept, data in examples.items():
            lines.append(data["definition"])

            if data["examples"]:
                lines.append(
                    "For example, " + ", ".join(data["examples"]) + "."
                )

        return " ".join(lines)

    if relations:
        # existing relation-based narration
        ...

    return ""
