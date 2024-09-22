import express from "express";
import {
  claimReward,
  disposeBottle,
  getAllUsersDisposedBottleHistory,
  getOneUserDisposedBottleHistory,
  getAllUsersRewardClaimHistory,
  getOneUserRewardClaimHistory,
  updateDisposedBottle,
  removeDisposedBottle,
  removeUserDisposedBottle,
  updateRewardClaim,
  removeRewardClaim,
  removeUserRewardClaim,
} from "../controllers/historyController.js";
const historyRoutes = express.Router();

// * DISPOSAL
// * add a new bottle disposal history
historyRoutes.post("/dispose", disposeBottle);

// * update disposal record
historyRoutes.put("/dispose/:id", updateDisposedBottle);

// * delete disposal record
historyRoutes.delete("/dispose/:id", removeDisposedBottle);

// * delete disposal record per user
historyRoutes.delete("/dispose/all/:userId", removeUserDisposedBottle);

// * get all users disposal history
historyRoutes.get("/dispose", getAllUsersDisposedBottleHistory);

// * get one user disposal history
historyRoutes.get("/dispose/:userId", getOneUserDisposedBottleHistory);

// * REWARD CLAIM
// * add a new reward claim history
historyRoutes.post("/claim", claimReward);

// * update reward claim record
historyRoutes.put("/claim/:id", updateRewardClaim);

// * delete reward claim record
historyRoutes.delete("/claim/:id", removeRewardClaim);

// * delete reward claim record per user
historyRoutes.delete("/claim/all/:userId", removeUserRewardClaim);

// * get all users reward claim history
historyRoutes.get("/claim", getAllUsersRewardClaimHistory);

// * get one user reward claim history
historyRoutes.get("/claim/:userId", getOneUserRewardClaimHistory);

export default historyRoutes;
