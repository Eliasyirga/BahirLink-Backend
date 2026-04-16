const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const multer = require("multer");

// Initialize multer.
// memoryStorage is usually best if you plan to upload to Cloudinary/S3 later.
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Use upload.single("media")
// This parses the text fields into req.body and the file into req.file
router.post(
  "/create/:userId",
  upload.single("media"),
  serviceController.create,
);

router.put("/:id", serviceController.update);
router.get("/all", serviceController.getAll);
router.get("/type/:serviceTypeId", serviceController.getByServiceType);
router.get("/user/:userId", serviceController.getByUser);
router.delete("/:id", serviceController.delete);

module.exports = router;
