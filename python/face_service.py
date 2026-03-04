"""
Face Recognition Flask Service
Run: python face_service.py
Port: 8000
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import base64
import pickle
import os
import cv2

app = Flask(__name__)
CORS(app)

MODEL_FILE = "trained_faces.pkl"

def load_model():
    if os.path.exists(MODEL_FILE):
        with open(MODEL_FILE, "rb") as f:
            return pickle.load(f)
    return {"encodings": [], "ids": []}

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.json
    image_b64 = data.get("image", "")
    
    # Decode base64 image
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
    
    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    face_locations = face_recognition.face_locations(rgb_img)
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    
    if not face_encodings:
        return jsonify({"recognized": False, "message": "No face detected"})
    
    model = load_model()
    if not model["encodings"]:
        return jsonify({"recognized": False, "message": "Model not trained yet"})
    
    matches = face_recognition.compare_faces(model["encodings"], face_encodings[0], tolerance=0.5)
    distances = face_recognition.face_distance(model["encodings"], face_encodings[0])
    
    if True in matches:
        best_idx = np.argmin(distances)
        if matches[best_idx]:
            student_id = model["ids"][best_idx]
            confidence = round((1 - distances[best_idx]) * 100, 1)
            return jsonify({"recognized": True, "recognizedId": student_id, "confidence": confidence})
    
    return jsonify({"recognized": False, "message": "Face not recognized"})

@app.route("/train", methods=["POST"])
def train():
    data = request.json
    student_id = data.get("studentId")
    image_b64 = data.get("image", "")
    
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
    
    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    encodings = face_recognition.face_encodings(rgb_img)
    if not encodings:
        return jsonify({"success": False, "message": "No face in image"})
    
    model = load_model()
    # Remove existing encoding for this student
    if student_id in model["ids"]:
        idx = model["ids"].index(student_id)
        model["encodings"].pop(idx)
        model["ids"].pop(idx)
    
    model["encodings"].append(encodings[0])
    model["ids"].append(student_id)
    
    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)
    
    return jsonify({"success": True, "message": f"Face trained for {student_id}"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
