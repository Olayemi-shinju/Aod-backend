import dotenv from "dotenv";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Cloudinary storage configuration (Images only)
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const folder =
      file.fieldname === "image"
        ? "category"
        : file.fieldname === "images"
        ? "products"
        : file.fieldname === "cover"
        ? "covers"
        : file.fieldname === "avatar"
        ? "avatars"
        : file.fieldname === "project"
        ? "project"
        : "default";

    return {
      folder,
      allowedFormats: ["jpeg", "jpg", "png", "gif", "webp"],
      resource_type: "image",
    };
  },
});

// Multer setup (image-only, max 10 MB)
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10 MB limit
  fileFilter(req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Invalid file type. Only JPEG, JPG, PNG, GIF, WEBP allowed.");
      error.code = "LIMIT_FILE_TYPES";
      return cb(error);
    }
    cb(null, true);
  },
}).fields([
  { name: "avatar" },
  { name: "project" },
  { name: "cover" },
  { name: "images" },
  { name: "image" },
]);

// Middleware to handle uploads and errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        message: "File upload error",
        error: err.message,
      });
    }
    next();
  });
};

export default uploadMiddleware;
