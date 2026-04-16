from flask import Flask, jsonify, request
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import requests
import base64
import json
from ultralytics import YOLO

# Import your custom model builder
from model_builder import build_model

app = Flask(__name__)

# --- CORS SETTINGS ---
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

# ==============================================================================
# --- 🚀 MODEL INITIALIZATION (LOAD ONCE ON STARTUP) ---
# ==============================================================================
print("Initializing AI Models... This may take a moment on the Raspberry Pi.")

# Force CPU mode for the Raspberry Pi
DEVICE = torch.device("cpu")

# 1. Load YOLOv8 Model
try:
    yolo_model = YOLO("best_yolo.pt")  # Replace with your actual YOLO weights filename
    print("✅ YOLO Model Loaded")
except Exception as e:
    print(f"❌ Failed to load YOLO: {e}")

# 2. Load Calibration Data
try:
    with open("viability_calibration.json", "r") as f:
        calib_data = json.load(f)
        TEMPERATURE = calib_data["temperature"]
        SUCCESS_THRESHOLD = calib_data["success_threshold"]
        SUCCESS_IDX = calib_data["success_class_index"]
        CLASSES = calib_data["classes"]
    print("✅ Calibration Data Loaded")
except Exception as e:
    print(f"❌ Failed to load calibration: {e}")
    # Fallbacks just in case
    TEMPERATURE = 1.0
    SUCCESS_THRESHOLD = 0.5
    SUCCESS_IDX = 1
    CLASSES = ["failed", "success"]

# 3. Load MobileNetV3 Classifier
try:
    classifier = build_model(num_classes=len(CLASSES), freeze_features=False)
    classifier.load_state_dict(
        torch.load("propagate_mobilenetv3_cropped.pth", map_location=DEVICE)
    )
    classifier.to(DEVICE)
    classifier.eval()  # MUST be in eval mode for inference
    print("✅ MobileNetV3 Classifier Loaded")
except Exception as e:
    print(f"❌ Failed to load Classifier: {e}")

# 4. Standard ImageNet Transforms for MobileNet
transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)
# ==============================================================================


def load_image_from_request(image_data):
    """Helper to handle both web URLs and Base64 encoded images from React webcams."""
    if image_data.startswith("http"):
        response = requests.get(image_data)
        img = Image.open(io.BytesIO(response.content)).convert("RGB")
    else:
        # Assume base64 string
        if "," in image_data:
            image_data = image_data.split(",")[1]
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return img


@app.route("/", methods=["GET"])
def home():
    return "Prop-a-bility Backend is Running!"


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify(
        {"status": "online", "host": "Raspberry Pi 5", "project": "Prop-a-bility"}
    )


# --- THE AI ANALYSIS ENDPOINT ---
@app.route("/analyze", methods=["POST"])
def analyze_plant():
    try:
        data = request.get_json()
        image_url = data.get("image_url")  # supabase publicUrl

        if not image_url:
            return jsonify({"error": "No image provided"}), 400
        print(f"Downloading image from Supabase...")

        response = requests.get(image_url)
        if response.status_code != 200:
            return jsonify({"error": "Failed to download image from cloud"}), 400

        img = Image.open(io.BytesIO(response.content)).convert(("RGB"))

        # ---------------------------------------------------------
        # STEP 1: YOLO OBJECT DETECTION & CROPPING
        # ---------------------------------------------------------
        results = yolo_model(img, verbose=False)
        boxes = results[0].boxes

        # THE GRACEFUL FAIL: If no plant is detected
        if len(boxes) == 0:
            return jsonify(
                {
                    "status": "error",
                    "message": "No plant node detected. Please move closer, ensure good lighting, and center the node.",
                }
            ), 400

        img_width, img_height = img.size

        # Get the bounding box with the highest confidence
        best_box = boxes.data[0]  # [x1, y1, x2, y2, confidence, class]
        x1, y1, x2, y2 = map(int, best_box[:4])

        # Crop the image using Pillow
        cropped_img = img.crop((x1, y1, x2, y2))

        # ---------------------------------------------------------
        # STEP 2: MOBILENETV3 CLASSIFICATION
        # ---------------------------------------------------------
        input_tensor = (
            transform(cropped_img).unsqueeze(0).to(DEVICE)
        )  # Add batch dimension

        with torch.no_grad():
            raw_logits = classifier(input_tensor)

            # Apply Temperature Scaling to fix overconfidence
            calibrated_logits = raw_logits / TEMPERATURE

            # Convert to percentages using Softmax
            probabilities = torch.softmax(calibrated_logits, dim=1)[0]
            success_prob = probabilities[SUCCESS_IDX].item()

        # Convert to a readable percentage (e.g., 0.854 -> 85)
        final_percentage = int(success_prob * 100)

        # ---------------------------------------------------------
        # STEP 3: BUSINESS LOGIC & FEEDBACK
        # ---------------------------------------------------------
        if success_prob >= SUCCESS_THRESHOLD:
            health = "Excellent"
            feedback = "Strong node visibility and healthy tissue detected. High potential for roots."
        elif success_prob >= (SUCCESS_THRESHOLD - 0.20):
            # Give a buffer for "Fair"
            health = "Fair"
            feedback = "Stem looks viable, but structure is borderline. Keep a close eye on water propagation."
        else:
            health = "At Risk"
            feedback = "Signs of rot or insufficient node structure detected. Propagation is unlikely."

        result = {
            "status": "success",
            "success_rate": final_percentage,
            "health_status": health,
            "feedback": feedback,
            "yolo_confidence": float(best_box[4]),  # Good for debugging
            "bbox": [x1, y1, x2, y2],
            "image_dimensions": [img_width, img_height],
        }

        return jsonify(result), 200

    except Exception as e:
        import traceback

        traceback.print_exc()  # Prints the exact error to your Pi's terminal
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5008)
