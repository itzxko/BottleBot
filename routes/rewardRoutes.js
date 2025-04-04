import multer from "multer";
import express from "express";
import {
  addReward,
  getAllRewards,
  getOneReward,
  updateReward,
  removeReward,
} from "../controllers/rewardController.js";
import { createResponse } from "../utils/response.js";

const rewardRoutes = express.Router();

// * setup multer for uploading images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // * ensure "uploads" directory exists
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

// * Middleware to check if file is missing
const checkFile = (req, res, next) => {
  if (!req.file) {
    let response = createResponse();
    response.message = "Image upload failed or missing!";
    return res.status(400).json(response);
  }
  next();
};

// ! file uploaded using REST client becomes corrupted
// ? test on actual frontend input
rewardRoutes.post("/", upload.single("image"), checkFile, addReward);

// * update reward
// rewardRoutes.post("/:id", upload.single("image"), checkFile, updateReward);
rewardRoutes.post("/:id", upload.single("image"), updateReward);

// * remove reward
rewardRoutes.delete("/:id", removeReward);

// * get all rewards
rewardRoutes.get("/", getAllRewards);

// * get one reward
rewardRoutes.get("/:id", getOneReward);

export { rewardRoutes };
