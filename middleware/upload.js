const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // SECURE CHECK: If no file field was provided, bypass Cloudinary parameters safely
    if (!file) return {};

    // Determine the resource type dynamically to prevent upload parsing errors
    const isVideo = file.mimetype.startsWith("video/");

    return {
      folder: "bahirlink_uploads",
      allowed_formats: ["jpg", "jpeg", "png", "mp4"],
      resource_type: isVideo ? "video" : "image", // Explicit typing is much more stable than "auto"
    };
  },
});

// Build the engine instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB safety limit for video uploads
  },
});

module.exports = upload;
