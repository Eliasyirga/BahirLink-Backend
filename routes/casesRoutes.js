const express = require("express");
const router = express.Router();
const casesController = require("../controllers/casesController");

router.post("/", casesController.createCase);


router.get("/", casesController.getAllCases);

router.get("/:id", casesController.getCaseById);

router.put("/:id/status", casesController.updateCaseStatus);

router.delete("/:id", casesController.deleteCase);

module.exports = router;