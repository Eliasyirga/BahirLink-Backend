const fs = require("fs");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

// Identity-verification uploads (ID card + selfie) are processed locally and
// deleted afterwards — they are NOT written under public/ and never served.
const VERIFY_UPLOAD_DIR = path.join(os.tmpdir(), "bahirlink-verify");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(VERIFY_UPLOAD_DIR, { recursive: true }, (err) =>
      cb(err, VERIFY_UPLOAD_DIR),
    );
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only image uploads are allowed"));
  },
});

module.exports = { upload, VERIFY_UPLOAD_DIR };
