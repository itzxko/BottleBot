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
  getUserBottleDisposalCount,
  getCurrentUserPointsAvailable,
  getOneDisposedBottleHistory,
  getOneRewardClaimHistory,
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
historyRoutes.get("/dispose/user/:userId", getOneUserDisposedBottleHistory);

// * get one disposal history
historyRoutes.get("/dispose/:id", getOneDisposedBottleHistory);

// * get user's bottle count
historyRoutes.get("/dispose/bottle/:userId", getUserBottleDisposalCount);


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
historyRoutes.get("/claim/user/:userId", getOneUserRewardClaimHistory);

// * get one unique reward claim history
historyRoutes.get("/claim/:id", getOneRewardClaimHistory);

// * get user's points
historyRoutes.get("/claim/points/:userId", getCurrentUserPointsAvailable);

export default historyRoutes;
