const express = require("express");
const router = express.Router();

const {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
} = require("../controllers/agencyTypeController");

// Create Agency Type
router.post("/", createAgencyTypeHandler);

// Update Agency Type
router.put("/:id", updateAgencyTypeHandler);

// Delete Agency Type
router.delete("/:id", deleteAgencyTypeHandler);

module.exports = router;
