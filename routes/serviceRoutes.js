// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// ✅ CREATE SERVICE
router.post("/", serviceController.create);

// ✅ UPDATE SERVICE
router.put("/:id", serviceController.update);

// ✅ GET ALL SERVICES
router.get("/", serviceController.getAll);

// ✅ GET SERVICES BY SERVICE TYPE
router.get("/type/:serviceTypeId", serviceController.getByServiceType);

// ✅ GET SERVICES BY USER (citizenId)
router.get("/user/:userId", serviceController.getByUser);

// ✅ DELETE SERVICE
router.delete("/:id", serviceController.delete);

module.exports = router;
