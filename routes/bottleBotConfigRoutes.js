import express from "express";
import multer from "multer";

import {
  getEquivalentInPointsBasedOnWeight,
  isBottleBotConfigSet,
  setBottleBotConfig,
  updateBottleBotConfig,
  sendDetectionToPythonScript,
} from "../controllers/bottleBotConfigController.js";

const bottleBotConfigRoutes = express.Router();

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

bottleBotConfigRoutes.get("/", isBottleBotConfigSet);
bottleBotConfigRoutes.get(
  "/calculate/:bottleWeight",
  getEquivalentInPointsBasedOnWeight
);
bottleBotConfigRoutes.post("/", setBottleBotConfig);
bottleBotConfigRoutes.put("/:id", updateBottleBotConfig);

// ! SAMPLE ONLY, TO BE DELETED SOON
// bottleBotConfigRoutes.get(
//   "/detect",
//   upload.single("image"),
//   sendDetectionToPythonScript
// );

// ! SAMPLE ONLY, TO BE DELETED SOON
bottleBotConfigRoutes.get("/detect", sendDetectionToPythonScript);

export default bottleBotConfigRoutes;
