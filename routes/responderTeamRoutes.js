const express = require("express");
const router = express.Router();

const {
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
} = require("../controllers/responderTeamController");

// Create a new responder team with multiple kebeles
router.post("/", createTeamHandler);

// Update a responder team by ID (can also update kebeles)
router.put("/:id", updateTeamHandler);

// Delete a responder team by ID
router.delete("/:id", deleteTeamHandler);

module.exports = router;
