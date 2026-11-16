// Lazily loaded by controllers/verifyController.js — requiring this file
// throws if the native deps (canvas, @tensorflow/tfjs-node) are missing, and
// loadModels() throws if the weight files are missing. The controller turns
// either case into a 503 so the server itself never crashes.
const fs = require("fs");
const path = require("path");
const faceapi = require("@vladmandic/face-api");
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// NOTE: was path.join(__dirname, "..", "models") — that is the Sequelize
// models folder, which holds no face weights.
const MODEL_PATH =
  process.env.FACE_MODELS_PATH || path.join(__dirname, "..", "face-models");

const REQUIRED_MANIFESTS = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-weights_manifest.json",
];

let modelsLoaded = false;

const loadModels = async () => {
  if (modelsLoaded) return;

  const missing = REQUIRED_MANIFESTS.filter(
    (f) => !fs.existsSync(path.join(MODEL_PATH, f)),
  );
  if (missing.length) {
    const err = new Error(`Face model files missing: ${missing.join(", ")}`);
    err.code = "FACE_MODELS_MISSING";
    throw err;
  }

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

  modelsLoaded = true;
};

const getFaceDescriptor = async (imagePath) => {
  const img = await canvas.loadImage(imagePath);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
};

const compareDescriptors = (desc1, desc2) => {
  const distance = faceapi.euclideanDistance(desc1, desc2);
  return {
    distance,
    score: 1 - distance,
  };
};

module.exports = { loadModels, getFaceDescriptor, compareDescriptors };
