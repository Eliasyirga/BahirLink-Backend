const express = require("express");
const router = express.Router();
const emergencyController = require("../controllers/emergencyController");
const upload = require("../middleware/upload");
const safeUpload = require("../middleware/safeUpload");
const {
  verifyToken,
  requireType,
  requireAccess,
  adminOnly,
  staffOnly,
  ADMIN_ROLES,
} = require("../middleware/auth");

// Multer/Cloudinary rejections → 400 with a clear message (not the global 500).
const safeUploadWrapper = safeUpload(upload.single("media"), { maxMb: 25 });

// Citizens (owner checks in controller) + admin/serviceadmin users.
const citizenOrAdmin = requireAccess({ userRoles: ["user", ...ADMIN_ROLES] });

// --- CREATE ---
router.post(
  "/users/:userId",
  verifyToken,
  requireType("user"),
  safeUploadWrapper,
  emergencyController.createUserEmergencyHandler,
);

// Public: guest (not logged in) reporting
router.post(
  "/guests",
  safeUploadWrapper,
  emergencyController.createGuestEmergencyHandler,
);

// --- READ ---
router.get(
  "/admin/all",
  verifyToken,
  adminOnly,
  emergencyController.getAllEmergenciesAdmin,
);

// Owner citizen or staff (checked in controller)
router.get(
  "/detail/:id",
  verifyToken,
  emergencyController.getEmergencyByIdHandler,
);

// Staff only: admin/serviceadmin users, agency, responder (and crew)
router.patch(
  "/:id/status",
  verifyToken,
  staffOnly,
  emergencyController.updateEmergencyStatusHandler,
);

// NOTE: still public — not used by current clients; deviceId is not sequential.
router.get(
  "/device/:deviceId",
  emergencyController.getEmergenciesByDeviceIdHandler,
);

router.get(
  "/responder-team/:responderTeamId",
  verifyToken,
  staffOnly,
  emergencyController.getEmergenciesForResponderTeamHandler,
);

router.get(
  "/agency/:agencyId/emergencies",
  verifyToken,
  staffOnly,
  emergencyController.getEmergenciesByAgencyHandler,
);

// Own list (token user id must match) or staff (checked in controller)
router.get(
  "/:userOrGuestId",
  verifyToken,
  emergencyController.getEmergenciesHandler,
);

// --- UPDATE / DELETE: owning citizen or admin/serviceadmin ---
router.put(
  "/:userOrGuestId/:id",
  verifyToken,
  citizenOrAdmin,
  safeUploadWrapper,
  emergencyController.updateEmergencyHandler,
);

router.delete(
  "/:userOrGuestId/:id",
  verifyToken,
  citizenOrAdmin,
  emergencyController.deleteEmergencyHandler,
);

module.exports = router;
