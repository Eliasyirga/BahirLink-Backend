const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Map an uploaded file's mimetype to the model's mediaType enum
 * ("photo" | "video" | "audio"). Returns null for unknown types.
 */
const mediaTypeFromMime = (mimetype) => {
  const m = String(mimetype || "").toLowerCase();
  if (m.startsWith("image/")) return "photo";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  return null;
};

// Cloudinary keeps images under resource_type "image"; video AND audio under "video".
const resourceTypeFor = (mediaType) =>
  mediaType === "video" || mediaType === "audio" ? "video" : "image";

/**
 * Best-effort delete of a Cloudinary asset. Never throws — failures are
 * logged so they can't break the request that triggered the cleanup.
 */
const destroyMedia = async (publicId, mediaType) => {
  if (!publicId) return;
  const resource_type = resourceTypeFor(mediaType);
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type, invalidate: true });
    if (res && res.result !== "ok" && res.result !== "not found") {
      console.warn(`⚠️ Cloudinary destroy ${publicId} (${resource_type}):`, res.result);
    }
  } catch (err) {
    console.error(`❌ Cloudinary destroy failed for ${publicId} (${resource_type}):`, err.message || err);
  }
};

/**
 * Remove a just-uploaded multer file (e.g. when the DB write that should
 * reference it failed). Fire-and-forget.
 */
const discardUploadedFile = (file, mediaType) => {
  if (!file || !file.filename || !/^https?:\/\//.test(file.path || "")) return;
  destroyMedia(file.filename, mediaType || mediaTypeFromMime(file.mimetype));
};

module.exports = { mediaTypeFromMime, resourceTypeFor, destroyMedia, discardUploadedFile };
