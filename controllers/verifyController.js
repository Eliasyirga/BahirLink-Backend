const fs = require("fs");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const UNAVAILABLE = "Identity verification is temporarily unavailable";

/**
 * Heavy/native deps (tesseract, @vladmandic/face-api, canvas, tfjs-node, face
 * weights) are required lazily here so a missing dependency can never crash
 * server startup — it only turns this endpoint into a 503.
 */
let engine = null;
const loadEngine = async () => {
  if (engine) return engine;
  const ocr = require("../services/ocrService");
  const face = require("../services/faceService");
  await face.loadModels();
  engine = { ...ocr, ...face };
  return engine;
};

const cleanup = (...files) =>
  files.forEach((f) => {
    if (f?.path) fs.unlink(f.path, () => {});
  });

const verifyIdentity = async (req, res) => {
  const idImage = req.files?.id_image?.[0];
  const selfie = req.files?.selfie?.[0];

  try {
    if (!idImage || !selfie)
      return errorResponse(res, "id_image and selfie are required", 400);

    let e;
    try {
      e = await loadEngine();
    } catch (depErr) {
      console.error("[verify] engine unavailable:", depErr.message);
      return errorResponse(res, UNAVAILABLE, 503);
    }

    // OCR extraction
    const ocrText = await e.ocrExtract(idImage.path);
    const extractedFields = e.parseIdFields(ocrText);

    // Face descriptor extraction
    const idDescriptor = await e.getFaceDescriptor(idImage.path);
    const selfieDescriptor = await e.getFaceDescriptor(selfie.path);

    if (!idDescriptor)
      return errorResponse(res, "No face detected in ID image", 422);

    if (!selfieDescriptor)
      return errorResponse(res, "No face detected in selfie image", 422);

    const comparison = e.compareDescriptors(idDescriptor, selfieDescriptor);
    const isMatch = comparison.distance < 0.55;

    const result = {
      ocr: {
        raw: ocrText,
        parsed: extractedFields,
      },
      face: {
        distance: comparison.distance,
        score: comparison.score,
        matched: isMatch,
      },
      decision: isMatch ? "verified" : "rejected",
      timestamp: new Date(),
    };

    return successResponse(res, result);
  } catch (error) {
    console.error("[verify] error:", error);
    return errorResponse(res, "Identity verification failed", 500);
  } finally {
    cleanup(idImage, selfie);
  }
};

module.exports = { verifyIdentity };
