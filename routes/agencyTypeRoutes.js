const express = require("express");
const router = express.Router();

const {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
  getAllAgencyTypesHandler,
  getAgentsByCreatorIdHandler,
} = require("../controllers/agencyTypeController");
const { verifyToken } = require("../middleware/auth");

// ── Public ────────────────────────────────────────────────
router.get("/", getAllAgencyTypesHandler);

// ── Protected: specific named routes BEFORE /:id ─────────
// IMPORTANT: /my-agents must be declared before any /:id
// route, otherwise Express will treat "my-agents" as an id.
router.get("/my-agents", verifyToken, getAgentsByCreatorIdHandler);

// ── Protected: CRUD ───────────────────────────────────────
router.post("/",       verifyToken, createAgencyTypeHandler);
router.put("/:id",     verifyToken, updateAgencyTypeHandler);
router.delete("/:id",  verifyToken, deleteAgencyTypeHandler);

module.exports = router;