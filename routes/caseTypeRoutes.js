const express = require("express");
const router = express.Router();
const caseTypeController = require("../controllers/caseTypeController");
const {
  verifyToken,
  adminOnly,
  requireAccess,
  ADMIN_ROLES,
} = require("../middleware/auth");

// Public reads (citizen app lists case types)
router.get("/", caseTypeController.getAll);
router.get("/:id", caseTypeController.getOne);

// Responders create case types from the Cases page; admins manage them.
router.post(
  "/",
  verifyToken,
  requireAccess({ userRoles: ADMIN_ROLES, types: ["responder", "agency"] }),
  caseTypeController.create,
);
router.put("/:id", verifyToken, adminOnly, caseTypeController.update);
router.delete("/:id", verifyToken, adminOnly, caseTypeController.remove);

module.exports = router;
