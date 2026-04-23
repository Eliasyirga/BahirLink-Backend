const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");

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

// --- CREATE ---
router.post(
  "/users/:userId",
  verifyToken,
  upload.single("media"),
  emergencyController.createUserEmergencyHandler,
);

router.post(
  "/guests",
  upload.single("media"),
  emergencyController.createGuestEmergencyHandler,
);

// --- READ ---
router.get(
  "/detail/:id",
  verifyToken,
  emergencyController.getEmergencyByIdHandler,
);

// NEW: This matches the frontend call: axios.patch(.../api/emergencies/${targetId}/status)
router.patch(
  "/:id/status",
  verifyToken,
  emergencyController.updateEmergencyStatusHandler,
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

// --- UPDATE & DELETE ---
router.put(
  "/:userOrGuestId/:id",
  verifyToken,
  upload.single("media"),
  emergencyController.updateEmergencyHandler,
);

router.delete(
  "/:userOrGuestId/:id",
  verifyToken,
  emergencyController.deleteEmergencyHandler,
);

module.exports = router;
