import multer from "multer";
import express from "express";
import { add } from "../controllers/rewardController.js";

const rewardRoutes = express.Router();

// * setup multer for uploading images
console.log("MULTER CALLED");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // * ensure "uploads" directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // * limit files to 5MB
  fileFilter: (req, file, cb) => {
    // * accept only specific file types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."),
        false
      );
    }
  },
});

// ! file uploaded using REST client becomes corrupted
// ? test on actual frontend input
rewardRoutes.post("/", upload.single("image"), add);

export { rewardRoutes };
