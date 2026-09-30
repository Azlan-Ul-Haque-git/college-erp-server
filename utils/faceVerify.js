import * as faceapi from "face-api.js";
import canvas from "canvas";
import path from "path";
import { fileURLToPath } from "url";

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Models ek baar load karo
let modelsLoaded = false;

const loadModels = async () => {
    if (modelsLoaded) return;

    const modelsPath = path.join(__dirname, "../public/models");

    console.log("🔄 Loading face models from:", modelsPath);

    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

    modelsLoaded = true;
    console.log("✅ Face models loaded");
};

export const verifyFace = async (image1, image2) => {
    try {
        await loadModels();

        const img1 = await canvas.loadImage(image1);
        const img2 = await canvas.loadImage(image2);

        const options = new faceapi.TinyFaceDetectorOptions();

        const face1 = await faceapi
            .detectSingleFace(img1, options)
            .withFaceLandmarks()
            .withFaceDescriptor();

        const face2 = await faceapi
            .detectSingleFace(img2, options)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!face1 || !face2) {
            console.log("⚠️  Face not detected in one or both images");
            return false;
        }

        const distance = faceapi.euclideanDistance(
            face1.descriptor,
            face2.descriptor
        );

        console.log("📏 Face distance:", distance.toFixed(3));
        return distance < 0.6;
    } catch (err) {
        console.error("❌ Face verification error:", err.message);
        return false;
    }
};