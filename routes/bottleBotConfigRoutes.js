import express from "express";
import {
  getEquivalentInPointsBasedOnWeight,
  isBottleBotConfigSet,
  setBottleBotConfig,
  updateBottleBotConfig,
} from "../controllers/bottleBotConfigController.js";

const bottleBotConfigRoutes = express.Router();

bottleBotConfigRoutes.get("/", isBottleBotConfigSet);
bottleBotConfigRoutes.get(
  "/calculate/:bottleWeight",
  getEquivalentInPointsBasedOnWeight
);
bottleBotConfigRoutes.post("/", setBottleBotConfig);
bottleBotConfigRoutes.put("/:id", updateBottleBotConfig);

export default bottleBotConfigRoutes;
