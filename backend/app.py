from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)

# UPDATED CORS: Added localhost so you can test from your machine
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "https://prop-a-bility.com",
                "https://www.prop-a-bility.com",
                "http://localhost:5173",  # Vite Localhost
                "http://127.0.0.1:5173",
            ]
        }
    },
)


@app.route("/", methods=["GET"])
def home():
    return "Prop-a-bility Backend is Running!"


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify(
        {"status": "online", "host": "Raspberry Pi 5", "project": "Prop-a-bility"}
    )


# --- NEW: The Analysis Endpoint ---
@app.route("/analyze", methods=["POST"])
def analyze_plant():
    try:
        data = request.get_json()
        image_url = data.get("image_url")

        if not image_url:
            return jsonify({"error": "No image URL provided"}), 400

        print(f"Received analysis request for: {image_url}")

        # ---------------------------------------------------------
        # TODO: INSERT YOUR REAL AI MODEL HERE LATER
        # For now, we simulate a successful AI prediction
        # so we can test the frontend flow.
        # ---------------------------------------------------------

        # Mock Logic: Randomly generate a "result"
        mock_success_rate = random.randint(30, 95)

        if mock_success_rate > 75:
            health = "Excellent"
            feedback = "Strong node visibility. High potential for roots."
        elif mock_success_rate > 50:
            health = "Fair"
            feedback = "Stem looks healthy, but node is partially obscured."
        else:
            health = "At Risk"
            feedback = "Signs of rot or insufficient node structure detected."

        result = {
            "species": "Epipremnum aureum (Pothos)",  # Mock species
            "success_rate": mock_success_rate,
            "health_status": health,
            "feedback": feedback,
        }

        return jsonify(result), 200

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
