const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/auth");

const {
  createKebeleHandler,
  updateKebeleHandler,
  deleteKebeleHandler,
  getAllKebelesHandler,
  getKebelesByResponderTeamHandler,
} = require("../controllers/kebeleController");

// ── Public reads (citizen app) ────────────────────────────
router.get("/", getAllKebelesHandler);
router.get("/team/:responderTeamId", getKebelesByResponderTeamHandler);

// ── System admin ──────────────────────────────────────────
router.post("/", verifyToken, adminOnly, createKebeleHandler);
router.put("/:id", verifyToken, adminOnly, updateKebeleHandler);
router.delete("/:id", verifyToken, adminOnly, deleteKebeleHandler);

module.exports = router;
