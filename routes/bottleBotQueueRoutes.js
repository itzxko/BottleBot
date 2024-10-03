import express from "express";
import { addToQueue, removeToQueue } from "../controllers/bottleBotQueueController.js";
const bottleBotQueueRoutes = express.Router();

// * add on queue
bottleBotQueueRoutes.post("/", addToQueue);

// * when finished, remove in queue
bottleBotQueueRoutes.delete("/:id", removeToQueue);

export default bottleBotQueueRoutes;
