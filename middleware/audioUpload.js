const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Chat voice-message uploader (field "audio").
 *
 * Clients today:
 *   - web dashboard (MediaRecorder): audio/webm;codecs=opus, or audio/mp4 on
 *     Safari; filename "blob" (no extension)
 *   - Flutter mobile: AAC-LC in .m4a, sent as audio/mp4
 *   - Flutter web: opus in .webm, sent as audio/webm
 *
 * Cloudinary stores audio under resource_type "video".
 */
const AUDIO_MAX_MB = 10;
const AUDIO_FORMATS = [
  "webm", "weba", "ogg", "oga", "opus", "m4a", "mp4", "aac", "mp3", "mpeg",
  "wav", "3gp", "amr", "caf", "flac",
];
const AUDIO_MIME = /^(audio\/[\w.+-]+|video\/(webm|mp4|ogg|3gpp))$/i;

const extOf = (name) =>
  path.extname(name || "").replace(".", "").toLowerCase();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "bahirlink_audio",
    resource_type: "video",
    allowed_formats: AUDIO_FORMATS,
  }),
});

const audioUpload = multer({
  storage,
  limits: { fileSize: AUDIO_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const mime = String(file.mimetype || "").split(";")[0].trim();
    const ok =
      AUDIO_MIME.test(mime) ||
      // Some clients send a generic type; fall back to the extension.
      (mime === "application/octet-stream" && AUDIO_FORMATS.includes(extOf(file.originalname)));
    if (ok) return cb(null, true);
    const err = new Error(`Unsupported audio type "${mime || "unknown"}"`);
    err.code = "UNSUPPORTED_AUDIO";
    return cb(err);
  },
});

module.exports = { audioUpload, AUDIO_FORMATS, AUDIO_MAX_MB };
