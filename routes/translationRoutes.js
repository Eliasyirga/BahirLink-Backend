const express = require("express");
const router = express.Router();
const { translationLimiter } = require("../middleware/rateLimit");
const { translateGemini } = require("../controllers/translationController");

// Public (guests use the app too) but rate-limited per IP.
router.post("/gemini", translationLimiter, translateGemini);

module.exports = router;
