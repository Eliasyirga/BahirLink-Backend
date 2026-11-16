const multer = require("multer");

/**
 * Wraps a multer middleware (e.g. upload.single("media")) so a rejected or
 * failed upload answers 400 with a clear message instead of falling through
 * to the global 500 handler.
 *
 *   router.post("/x", safeUpload(upload.single("media"), { maxMb: 25 }), handler)
 */
const safeUpload = (multerMiddleware, opts = {}) => {
  const {
    maxMb,
    invalidMessage = "Media upload verification failed. Please check the file format or size.",
  } = opts;

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next();

      console.error("❌ Upload rejected:", err.code || "", err.message || err);

      let message = invalidMessage;
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          message = maxMb ? `File is too large (max ${maxMb} MB).` : "File is too large.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          message = `Unexpected file field "${err.field}".`;
        } else if (err.code === "LIMIT_FILE_COUNT") {
          message = "Too many files.";
        }
      }

      return res.status(400).json({ success: false, message });
    });
  };
};

module.exports = safeUpload;
