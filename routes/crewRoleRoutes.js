const express = require("express");
const router = express.Router();

const {
  createCrewRoleHandler,
  updateCrewRoleHandler,
  deleteCrewRoleHandler,
} = require("../controllers/crewRoleController");

// Create a new Crew Role
router.post("/", createCrewRoleHandler);

// Update an existing Crew Role by ID
router.put(":id", updateCrewRoleHandler);

// Delete a Crew Role by ID
router.delete("/:id", deleteCrewRoleHandler);

module.exports = router;
