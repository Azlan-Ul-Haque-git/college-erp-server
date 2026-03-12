import * as faceapi from "face-api.js";
import canvas from "canvas";

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export const verifyFace = async (image1, image2) => {

    const img1 = await canvas.loadImage(image1);
    const img2 = await canvas.loadImage(image2);

    const face1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
    const face2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

    if (!face1 || !face2) return false;

    const distance = faceapi.euclideanDistance(face1.descriptor, face2.descriptor);

    return distance < 0.6;

};