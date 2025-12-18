from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from generator import generate_js_for_concept

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    concept = data.get("concept", "").strip()

    if not concept:
        return jsonify({"error": "concept required"}), 400

    try:
        script = generate_js_for_concept(concept)

        if not script:
            return jsonify({"error": "model did not return valid JS"}), 500

        return jsonify({"script": script}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
