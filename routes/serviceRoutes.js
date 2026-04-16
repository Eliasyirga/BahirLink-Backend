const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// ✅ This must match exports.create in the controller
// If you use 'serviceController.create', it must exist in that file!
router.post("/create/:userId", serviceController.create);

router.put("/:id", serviceController.update);
router.get("/all", serviceController.getAll);
router.get("/type/:serviceTypeId", serviceController.getByServiceType);
router.get("/user/:userId", serviceController.getByUser);
router.delete("/:id", serviceController.delete);

module.exports = router;
