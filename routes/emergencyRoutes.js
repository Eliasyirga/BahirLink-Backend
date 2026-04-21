const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");

/**
 * 🛡️ verifyToken Middleware
 */
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

// ==========================================
// 🚨 CREATE EMERGENCY
// ==========================================

// PROTECTED: Authenticated User Reporting
router.post(
  "/users/:userId",
  verifyToken,
  upload.single("media"), // Matches the 'media' key from Flutter
  emergencyController.createUserEmergencyHandler,
);

// PUBLIC: Guest Reporting (Used by GuestEmergencyReportPage)
router.post(
  "/guests",
  upload.single("media"), // Matches the 'media' key from Flutter
  emergencyController.createGuestEmergencyHandler,
);

// ==========================================
// 🔍 FETCHING ROUTES
// ==========================================

router.get(
  "/detail/:id",
  verifyToken,
  emergencyController.getEmergencyByIdHandler,
);
// PUBLIC: Get status of emergencies (Users or Guests)
// Note: If you want guests to see ONLY their reports, consider adding a phone-number check
router.get("/:userOrGuestId", emergencyController.getEmergenciesHandler);

// PROTECTED: Admin only access
router.get(
  "/admin/all",
  verifyToken,
  emergencyController.getAllEmergenciesAdmin,
);

// TEAM/AGENCY: Usually these should be protected so random people can't see active emergencies
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

// ==========================================
// 🛠️ UPDATE & DELETE
// ==========================================

// PROTECTED: Updates and Deletions should ALWAYS be authenticated
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
