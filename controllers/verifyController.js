const { ocrExtract, parseIdFields } = require("../services/ocrService");
const {
  loadModels,
  getFaceDescriptor,
  compareDescriptors,
} = require("../services/faceService");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const verifyIdentity = async (req, res) => {
  try {
    const idImage = req.files?.id_image?.[0];
    const selfie = req.files?.selfie?.[0];

    if (!idImage || !selfie)
      return errorResponse(res, "id_image and selfie are required", 400);

    await loadModels();

    // OCR extraction
    const ocrText = await ocrExtract(idImage.path);
    const extractedFields = parseIdFields(ocrText);

    // Face descriptor extraction
    const idDescriptor = await getFaceDescriptor(idImage.path);
    const selfieDescriptor = await getFaceDescriptor(selfie.path);

    if (!idDescriptor)
      return errorResponse(res, "No face detected in ID image", 422);

    if (!selfieDescriptor)
      return errorResponse(res, "No face detected in selfie image", 422);

    const comparison = compareDescriptors(idDescriptor, selfieDescriptor);
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
    console.error(error);
    return errorResponse(res, error.message);
  }
};

module.exports = { verifyIdentity };
