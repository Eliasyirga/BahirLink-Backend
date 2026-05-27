const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Links the SDK to your .env keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Sets up how files are handled when streamed to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bahirlink_uploads", // Automatically creates this folder in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "mp4"], // Restricts file types for safety
    resource_type: "auto", // Automatically detects if it's an image or a video
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
