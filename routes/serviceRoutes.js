const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const upload = require("../middleware/upload");
const safeUpload = require("../middleware/safeUpload");
const {
  verifyToken,
  requireType,
  requireAccess,
  staffOnly,
  ADMIN_ROLES,
} = require("../middleware/auth");

// Citizen service request — the citizen is the token's user (URL :userId ignored).
router.post(
  "/create/:userId",
  verifyToken,
  requireType("user"),
  safeUpload(upload.single("media"), { maxMb: 25 }),
  serviceController.create,
);

// Staff manage request status.
router.put("/:id", verifyToken, staffOnly, serviceController.update);

// Owner citizen (checked in controller) or admin/serviceadmin.
router.delete(
  "/:id",
  verifyToken,
  requireAccess({ userRoles: ["user", ...ADMIN_ROLES] }),
  serviceController.delete,
);

// Reads — NOTE: still public as before (clients call some without a token).
router.get("/all", serviceController.getAll);
router.get("/user/:userId", serviceController.getByUser);
router.get("/agency/:agencyId", serviceController.getServicesByAgency);
router.get(
  "/responder-team/:id",
  verifyToken,
  serviceController.getResponderTeamServices,
);

module.exports = router;
