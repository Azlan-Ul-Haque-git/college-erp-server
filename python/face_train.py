"""
Face Recognition Training Script
Run this to train the model with student face images
"""
import face_recognition
import pickle
import os
import sys

def train_faces(image_dir="faces", output_file="trained_faces.pkl"):
    known_encodings = []
    known_ids = []
    
    if not os.path.exists(image_dir):
        print(f"Create '{image_dir}' folder and add student images named as studentId.jpg")
        sys.exit(1)
    
    for filename in os.listdir(image_dir):
        if filename.endswith((".jpg", ".jpeg", ".png")):
            student_id = os.path.splitext(filename)[0]
            img_path = os.path.join(image_dir, filename)
            
            image = face_recognition.load_image_file(img_path)
            encodings = face_recognition.face_encodings(image)
            
            if encodings:
                known_encodings.append(encodings[0])
                known_ids.append(student_id)
                print(f"Trained: {student_id}")
            else:
                print(f"No face found in: {filename}")
    
    with open(output_file, "wb") as f:
        pickle.dump({"encodings": known_encodings, "ids": known_ids}, f)
    
    print(f"\nTraining complete! {len(known_ids)} faces trained.")

if __name__ == "__main__":
    train_faces()
