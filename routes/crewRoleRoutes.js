const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/auth");

const {
  createCrewRoleHandler,
  updateCrewRoleHandler,
  deleteCrewRoleHandler,
} = require("../controllers/crewRoleController");

// System admin only
router.post("/", verifyToken, adminOnly, createCrewRoleHandler);
router.put("/:id", verifyToken, adminOnly, updateCrewRoleHandler); // was ":id" (missing slash)
router.delete("/:id", verifyToken, adminOnly, deleteCrewRoleHandler);

module.exports = router;
