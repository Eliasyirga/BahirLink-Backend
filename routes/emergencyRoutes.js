const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");
const { validate } = require("uuid");
const validator = require("../utils/validator");
const { registerSchema } = require("../utils/schema");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

const safeUploadWrapper = (req, res, next) => {
  upload.single("media")(req, res, function (err) {
    if (err) {
      console.error("❌ Cloudinary/Multer Middleware Interceptor Error:", err);
      return res.status(400).json({
        success: false,
        message:
          "Media upload verification failed. Please check the file format or size.",
      });
    }
    next();
  });
};

// --- CREATE ---
router.post(
  "/users/:userId",
  verifyToken,
  safeUploadWrapper, // FIXED: Wrapped to prevent unhandled rejections on missing assets
  emergencyController.createUserEmergencyHandler,
);

router.post(
  "/guests",
  safeUploadWrapper, // FIXED: Wrapped to process text-only guest submissions flawlessly
  emergencyController.createGuestEmergencyHandler,
);

// --- READ ---
router.get(
  "/detail/:id",
  verifyToken,
  emergencyController.getEmergencyByIdHandler,
);

router.patch(
  "/:id/status",
  verifyToken,
  emergencyController.updateEmergencyStatusHandler,
);

router.get(
  "/device/:deviceId",
  emergencyController.getEmergenciesByDeviceIdHandler,
);

router.get("/:userOrGuestId", emergencyController.getEmergenciesHandler);

router.get(
  "/admin/all",
  verifyToken,
  emergencyController.getAllEmergenciesAdmin,
);

router.get(
  "/responder-team/:responderTeamId",
  verifyToken,
  emergencyController.getEmergenciesForResponderTeamHandler,
);

router.get(
  "/agency/:agencyId/emergencies",
  verifyToken,
  emergencyController.getEmergenciesByAgencyHandler,
);

router.put(
  "/:userOrGuestId/:id",
  verifyToken,
  safeUploadWrapper, // FIXED: Wrapped to securely handle updates with or without media changes
  emergencyController.updateEmergencyHandler,
);

router.delete(
  "/:userOrGuestId/:id",
  verifyToken,
  emergencyController.deleteEmergencyHandler,
);

module.exports = router;
