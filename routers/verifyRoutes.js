const express = require("express");
const { upload } = require("../utils/fileStorage");
const { verifyIdentity } = require("../controllers/verifyController");

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "id_image", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  verifyIdentity
);

module.exports = router;
