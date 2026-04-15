const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken"); // Added JWT for verification
const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");

/**
 * 🛡️ verifyToken Middleware
 * This extracts the Bearer token and verifies it using your JWT_SECRET
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No token or invalid format");
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res
      .status(401)
      .json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
  }
};

// --- CREATE ROUTES ---

// 🚨 PROTECTED: Now uses the verifyToken middleware defined above
router.post(
  "/users/:userId",
  verifyToken,
  upload.single("media"),
  emergencyController.createUserEmergencyHandler,
);

// 🔓 PUBLIC: Guests (No token needed)
router.post(
  "/guests",
  upload.single("media"),
  emergencyController.createGuestEmergencyHandler,
);

// --- UPDATE & DELETE ROUTES ---

router.put(
  "/:userOrGuestId/:id",
  verifyToken, // Added protection here too as these usually require login
  upload.single("media"),
  emergencyController.updateEmergencyHandler,
);

router.delete(
  "/:userOrGuestId/:id",
  verifyToken,
  emergencyController.deleteEmergencyHandler,
);

// --- FETCHING ROUTES ---

router.get("/:userOrGuestId", emergencyController.getEmergenciesHandler);

router.get(
  "/responder-team/:responderTeamId",
  emergencyController.getEmergenciesForResponderTeamHandler,
);

router.get(
  "/agency/:agencyId/emergencies",
  emergencyController.getEmergenciesByAgencyHandler,
);

router.get(
  "/admin/all",
  verifyToken,
  emergencyController.getAllEmergenciesAdmin,
);

module.exports = router;
