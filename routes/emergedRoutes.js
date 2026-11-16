const express = require("express");
const router = express.Router();
const { verifyToken, staffOnly } = require("../middleware/auth");

const {
  mergeEmergencies,
  getEmergedHandler,
  getEmergedByIdHandler,
  getUnassignedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
} = require("../controllers/emergedController");

// Every emerged endpoint is staff-only (admin/serviceadmin users, agency,
// responder, crew). Responder teams are further limited to their kebeles.
router.use(verifyToken, staffOnly);

router.post("/merge", mergeEmergencies);

router.get("/", getEmergedHandler);

router.get("/unassigned", getUnassignedHandler);

// Keep after fixed paths like /unassigned
router.get("/:id", getEmergedByIdHandler);

router.put("/:id", updateEmergedHandler);

router.delete("/:id", deleteEmergedHandler);

module.exports = router;
