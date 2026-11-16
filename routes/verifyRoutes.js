const express = require("express");
const { upload } = require("../utils/fileStorage");
const { verifyIdentity } = require("../controllers/verifyController");
const { verifyToken, requireType } = require("../middleware/auth");

const router = express.Router();

const uploadIdImages = (req, res, next) =>
  upload.fields([
    { name: "id_image", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });

// Mounted at /api/verify — citizens only.
router.post("/", verifyToken, requireType("user"), uploadIdImages, verifyIdentity);

module.exports = router;
