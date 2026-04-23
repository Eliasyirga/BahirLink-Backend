const express = require("express");
const router = express.Router();

const {
  mergeEmergencies,
  getEmergedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
} = require("../controllers/emergedController");

router.post("/merge", mergeEmergencies);

router.get("/", getEmergedHandler);

router.put("/:id", updateEmergedHandler);

router.delete("/:id", deleteEmergedHandler);

module.exports = router;
