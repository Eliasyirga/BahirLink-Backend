const express = require("express");
const router = express.Router();

const {
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
  getAllTeamsHandler,
  getTeamsByAgencyHandler,
  responderLoginHandler,
  getTeamByIdHandler, // This was the missing handler
} = require("../controllers/responderTeamController");

// ================= POST ROUTES =================
// Create a new responder team with multiple kebeles
router.post("/", createTeamHandler);

// Responder Authentication
router.post("/login", responderLoginHandler);

// ================= GET ROUTES =================
// Get all responder teams
router.get("/", getAllTeamsHandler);

// CRITICAL: Fetches single team info (used by AddCasePage to sync agencyId)
router.get("/:id", getTeamByIdHandler);

// Get all teams belonging to a specific agency
router.get("/agency/:agencyId", getTeamsByAgencyHandler);

// ================= PUT/DELETE ROUTES =================
// Update a responder team by ID (including kebele re-assignment)
router.put("/:id", updateTeamHandler);

// Delete a responder team by ID
router.delete("/:id", deleteTeamHandler);

module.exports = router;
