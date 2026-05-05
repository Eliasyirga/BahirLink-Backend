const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
  getAllAgenciesHandler,
  loginAgencyHandler,
  getAgentsByCreatorIdHandler,
} = require("../controllers/agencyController");

// Get all agencies
router.get("/", verifyToken, getAllAgenciesHandler);

// Create a new agency
router.post("/", verifyToken, createAgencyHandler);

// Update an existing agency
router.put("/:id", verifyToken, updateAgencyHandler);

// Delete an agency
router.delete("/:id", verifyToken, deleteAgencyHandler);

router.post("/agent-login", loginAgencyHandler);

router.get("/my-agents", verifyToken, getAgentsByCreatorIdHandler);
module.exports = router;
