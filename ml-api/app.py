import json
# pyrefly: ignore [missing-import]
import numpy as np
import tensorflow as tf

# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify

from flask_cors import CORS
# pyrefly: ignore [missing-import]
from PIL import Image

app = Flask(__name__)
CORS(app)

IMAGE_SIZE = 256

MODEL_PATH = "efficientnet_best_model.keras"
CLASS_NAMES_PATH = "class_names.json"

print("Loading model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully!")

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    class_names = json.load(f)

print("Number of classes:", len(class_names))


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Crop Disease ML API is running",
        "classes": len(class_names)
    })


@app.route("/predict", methods=["POST"])
def predict():

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "No file selected"
        }), 400

    try:

        # Open image
        image = Image.open(file).convert("RGB")

        # Resize
        image = image.resize((IMAGE_SIZE, IMAGE_SIZE))

        # Convert to numpy
        image = np.array(image).astype(np.float32)

        # Add batch dimension
        image = np.expand_dims(image, axis=0)

        # Prediction
        predictions = model.predict(
            image,
            verbose=0
        )[0]

        # Best prediction
        predicted_index = int(np.argmax(predictions))

        predicted_class = class_names[predicted_index]

        confidence = float(
            predictions[predicted_index]
        ) * 100

        # Top 3 predictions
        top_indices = np.argsort(predictions)[-3:][::-1]

        top_predictions = []

        for index in top_indices:

            top_predictions.append({
                "disease": class_names[int(index)],
                "confidence": round(
                    float(predictions[index]) * 100,
                    2
                )
            })

        return jsonify({

            "success": True,

            "disease": predicted_class,

            "confidence": round(
                confidence,
                2
            ),

            "top_predictions": top_predictions
        })

    except Exception as e:

        print("Prediction error:", str(e))

        return jsonify({
            "success": False,
            "error": "Prediction failed",
            "details": str(e)
        }), 500


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )