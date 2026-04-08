const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // Adjust path to your middleware file
const casesController = require("../controllers/casesController");

// Add the middleware here:
router.post("/", upload.single("media"), casesController.createCase);

router.get("/", casesController.getAllCases);
router.get("/:id", casesController.getCaseById);

router.get("/team/:responderTeamId", casesController.getCasesByResponderTeam);
router.put("/:id/status", casesController.updateCaseStatus);
router.delete("/:id", casesController.deleteCase);

module.exports = router;
