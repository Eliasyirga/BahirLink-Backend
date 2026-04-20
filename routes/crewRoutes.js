const express = require("express");
const router = express.Router();

const {
  createCrewHandler,
  updateCrewHandler,
  deleteCrewHandler,
  loginCrewHandler,
} = require("../controllers/crewController");

// Create a new Crew member
router.post("/", createCrewHandler);

// Update an existing Crew member by ID
router.put("/:id", updateCrewHandler);

// Delete a Crew member by ID
router.delete("/:id", deleteCrewHandler);

router.post("/login", loginCrewHandler);

module.exports = router;
