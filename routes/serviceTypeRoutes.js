const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceTypeController");
const { verifyToken, adminOnly } = require("../middleware/auth");

// Public reads (citizen app)
router.get("/", controller.getAllServiceTypes);
router.get("/:id", controller.getServiceTypeById);

// System admin
router.post("/", verifyToken, adminOnly, controller.createServiceType);
router.put("/:id", verifyToken, adminOnly, controller.updateServiceType);
router.delete("/:id", verifyToken, adminOnly, controller.deleteServiceType);

module.exports = router;
