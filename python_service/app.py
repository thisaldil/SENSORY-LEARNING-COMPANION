from flask import Flask, request, jsonify
from flask_cors import CORS
from generator import generate_scene

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json() or {}
    concept = (data.get("concept") or "").strip()

    if not concept:
        return jsonify({"error": "concept required"}), 400

    payload = generate_scene(concept)
    return jsonify(payload), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
