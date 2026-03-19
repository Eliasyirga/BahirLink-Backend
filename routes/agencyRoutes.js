const express = require("express");
const router = express.Router();

const {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
  getAllAgenciesHandler, // Added this
} = require("../controllers/agencyController");

// Get all agencies
router.get("/", getAllAgenciesHandler);

// Create a new agency
router.post("/", createAgencyHandler);

// Update an existing agency
router.put("/:id", updateAgencyHandler);

// Delete an agency
router.delete("/:id", deleteAgencyHandler);

module.exports = router;
