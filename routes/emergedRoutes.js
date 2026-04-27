const express = require("express");
const router = express.Router();

const {
  mergeEmergencies,
  getEmergedHandler,
  getUnassignedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
} = require("../controllers/emergedController");

router.post("/merge", mergeEmergencies);

router.get("/", getEmergedHandler);

router.get("/unassigned", getUnassignedHandler);

router.put("/:id", updateEmergedHandler);

router.delete("/:id", deleteEmergedHandler);

module.exports = router;
