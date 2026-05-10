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

// Create Agency Type
router.post("/", createAgencyTypeHandler);

// Update Agency Type
router.put("/:id", updateAgencyTypeHandler);

// Delete Agency Type
router.delete("/:id", deleteAgencyTypeHandler);

router.get("/", getAllAgencyTypesHandler);
router.get("/my-agents", verifyToken, getAgentsByCreatorIdHandler);

module.exports = router;
