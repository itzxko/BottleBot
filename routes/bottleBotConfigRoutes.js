import express from "express";
import {
  getEquivalentInPointsBasedOnWeight,
  isBottleBotConfigSet,
  setBottleBotConfig,
  updateBottleBotConfig,
  sendDetectionToRoboflow,
} from "../controllers/bottleBotConfigController.js";

const bottleBotConfigRoutes = express.Router();

bottleBotConfigRoutes.get("/", isBottleBotConfigSet);
bottleBotConfigRoutes.get(
  "/calculate/:bottleWeight",
  getEquivalentInPointsBasedOnWeight
);
bottleBotConfigRoutes.post("/", setBottleBotConfig);
bottleBotConfigRoutes.put("/:id", updateBottleBotConfig);

// ! SAMPLE ONLY, TO BE DELETED SOON
bottleBotConfigRoutes.get("/detect", sendDetectionToRoboflow);

export default bottleBotConfigRoutes;
