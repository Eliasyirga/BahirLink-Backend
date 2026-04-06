const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceTypeController");

router.post("/", controller.createServiceType);
router.get("/", controller.getAllServiceTypes);
router.get("/:id", controller.getServiceTypeById);
router.put("/:id", controller.updateServiceType);
router.delete("/:id", controller.deleteServiceType);

module.exports = router;
