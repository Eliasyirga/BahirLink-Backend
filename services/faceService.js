import * as faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import path from "path";
import { fileURLToPath } from "url";

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const modelPath = path.join(__dirname, "..", "models");

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

  modelsLoaded = true;
};

export const getFaceDescriptor = async (imagePath) => {
  const img = await canvas.loadImage(imagePath);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
};

export const compareDescriptors = (desc1, desc2) => {
  const distance = faceapi.euclideanDistance(desc1, desc2);
  return {
    distance,
    score: 1 - distance,
  };
};
