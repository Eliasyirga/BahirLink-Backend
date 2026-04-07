// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

router.post("/", serviceController.create);

router.put("/:id", serviceController.update);

router.get("/", serviceController.getAll);

router.get("/:serviceTypeId", serviceController.getByServiceType);

router.get("/:userId", serviceController.getByUser);

router.delete("/:id", serviceController.delete);

module.exports = router;
