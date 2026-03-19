const express = require("express");
const router = express.Router();
const caseTypeController = require("../controllers/caseTypeController");

router.post("/", caseTypeController.create);

router.get("/", caseTypeController.getAll);

router.get("/:id", caseTypeController.getOne);

router.put("/:id", caseTypeController.update);

router.delete("/:id", caseTypeController.remove);

module.exports = router;
