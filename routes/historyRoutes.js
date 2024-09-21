import express from "express";
import {
  claimReward,
  disposeBottle,
  getAllUsersDisposedBottleHistory,
  getOneUserDisposedBottleHistory,
  getAllUsersRewardClaimHistory,
  getOneUserRewardClaimHistory,
} from "../controllers/historyController.js";
const historyRoutes = express.Router();

// * DISPOSAL
// * add a new bottle disposal history
historyRoutes.post("/dispose", disposeBottle);

// * get all users disposal history
historyRoutes.get("/dispose", getAllUsersDisposedBottleHistory);

// * get one user disposal history
historyRoutes.get("/dispose/:id", getOneUserDisposedBottleHistory);

// * REWARD CLAIM
// * add a new reward claim history
historyRoutes.post("/claim", claimReward);

// * get all users reward claim history
historyRoutes.get("/claim", getAllUsersRewardClaimHistory);

// * get one user reward claim history
historyRoutes.get("/claim/:id", getOneUserRewardClaimHistory);

export default historyRoutes;
