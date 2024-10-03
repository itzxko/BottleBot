import mongoose from "mongoose";
import { bottleDisposalModel } from "../models/bottleDisposalModel.js";
import { rewardClaimModel } from "../models/rewardClaimModel.js";
import { createResponse } from "../utils/response.js";
import {
  getPointsRequiredForReward,
  getStockAvailableForReward,
  updateRewardStocks,
} from "./rewardController.js";

// TODO: include validation if the user exists
// TODO: include stock checking before claiming reward

// * BOTTLE DISPOSAL HISTORY

// * calculate total bottle count of user
const calculateUserBottleDisposalCount = async (userId) => {
  try {
    // * calculate total count of disposed bottles by the user
    const bottleCount = await bottleDisposalModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$userId",
          totalBottleCount: { $sum: "$bottleCount" },
        },
      },
    ]);

    // * if no bottles have been disposed of, set count to 0
    const totalBottleCount =
      bottleCount.length > 0 ? bottleCount[0].totalBottleCount : 0;

    return totalBottleCount;
  } catch (err) {
    console.error("Error calculating total bottle count:", err);
    throw err;
  }
};

// * return user's bottle count
const getUserBottleDisposalCount = async (req, res) => {
  const response = createResponse();
  const { userId } = req.params;
  try {
    const totalBottleCount = await calculateUserBottleDisposalCount(userId);
    response.success = true;
    response.totalBottleCount = { totalBottleCount };
    response.message = "Bottle count calculated successfully!";
    return res.json(response);
  } catch (err) {
    response.message = "Error calculating total bottle count";
    return res.status(500).json(response);
  }
};

// * get all disposal record
const getAllUsersDisposedBottleHistory = async (req, res) => {
  const response = createResponse();
  try {
    // * for filter
    const { userName } = req.query;
    // * create filter obj dynamically
    let filter = {};
    if (userName) {
      // * for searching in multiple fields with a match anywhere, case-insensitive
      filter["$or"] = [
        {
          "userInfo.personalInfo.firstName": {
            $regex: userName,
            $options: "i",
          },
        },
        {
          "userInfo.personalInfo.middleName": {
            $regex: userName,
            $options: "i",
          },
        },
        {
          "userInfo.personalInfo.lastName": { $regex: userName, $options: "i" },
        },
      ];
    }

    // * use aggregation to lookup user details and filter based on name
    let allusersdisposalhistory = await bottleDisposalModel.aggregate([
      {
        $lookup: {
          from: "users", // * match the collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo", // * unwind to treat the array as an object
      },
      {
        $match: filter, // * filter based on the user name
      },
      {
        $project: {
          bottleCount: 1,
          pointsAccumulated: 1,
          dateDisposed: 1,
          "userInfo.personalInfo.firstName": 1,
          "userInfo.personalInfo.middleName": 1,
          "userInfo.personalInfo.lastName": 1,
        },
      },
    ]);

    response.message = "all disposal record retrieved successfully!";
    response.success = true;
    response.allusersdisposalhistory = allusersdisposalhistory;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * get one disposal record
const getOneUserDisposedBottleHistory = async (req, res) => {
  const response = createResponse();
  try {
    const userid = req.params.userId;
    let userdisposalhistory = await bottleDisposalModel.find({
      userId: userid,
    });
    response.message = "user disposal record retrieved successfully!";
    response.success = true;
    response.userdisposalhistory = userdisposalhistory;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * add a new disposal record
const disposeBottle = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { userId, bottleCount, pointsAccumulated } = req.body;

    // * validate the req body first before anything
    if (!userId || !bottleCount || !pointsAccumulated) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * adding a new disposed bottle record in the disposal collection
    await bottleDisposalModel.create({
      userId,
      bottleCount,
      pointsAccumulated,
    });

    // ? testing purposes only
    let count = await calculateUserBottleDisposalCount(userId);
    if (count) {
      console.log("disposed bottle count : ", count);
    }

    response.message = "Bottle Disposal history successfully saved!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR:", err);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * update disposal record
const updateDisposedBottle = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { userId, bottleCount, pointsAccumulated } = req.body;
    const _id = req.params.id;

    console.log("req detected");

    // * validate the req body first before anything
    if (!_id || !userId || !bottleCount || !pointsAccumulated) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * updating a disposed bottle record in the disposal collection
    await bottleDisposalModel.findByIdAndUpdate(_id, {
      userId,
      bottleCount,
      pointsAccumulated,
    });

    response.message = "Disposed bottle record successfuly updated!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * delete one disposal record
const removeDisposedBottle = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    const deletedDisposedBottle = await bottleDisposalModel.findByIdAndDelete(
      _id
    );
    if (deletedDisposedBottle) {
      response.message = "Disposed bottle record successfuly deleted!";
      response.success = true;
    } else {
      response.message = "Disposed bottle record does not exists!";
      response.success = false;
    }
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * delete disposal history per user
const removeUserDisposedBottle = async (req, res) => {
  const response = createResponse();
  try {
    const userId = req.params.userId;
    const deletedDisposedBottles = await bottleDisposalModel.deleteMany({
      userId: userId,
    });
    if (deletedDisposedBottles.deletedCount > 0) {
      response.message =
        "All disposed bottle records for the user have been successfully deleted!";
      response.success = true;
    } else {
      response.message = "No disposed bottle records found for the user!";
      response.success = false;
    }
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * REWARDS CLAIMED HISTORY

// * calculate user available points
const calculateCurrentUserPointsAvailable = async (userId) => {
  try {
    // * calculate total points accumulated by the user from bottle disposal
    const accumulatedPointsResult = await bottleDisposalModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$pointsAccumulated" },
        },
      },
    ]);

    // * if no points have been accumulated, set to 0
    const totalPointsAccumulated =
      accumulatedPointsResult.length > 0
        ? accumulatedPointsResult[0].totalPoints
        : 0;

    // * calculate total points spent by the user on claimed rewards
    const claimedPointsResult = await rewardClaimModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$userId",
          totalPointsSpent: { $sum: "$pointsSpent" },
        },
      },
    ]);

    // * if no rewards have been claimed, set points spent to 0
    const totalPointsSpent =
      claimedPointsResult.length > 0
        ? claimedPointsResult[0].totalPointsSpent
        : 0;

    // * calculate available points
    const availablePoints = totalPointsAccumulated - totalPointsSpent;

    return availablePoints >= 0 ? availablePoints : 0;
  } catch (err) {
    console.error("Error calculating available points:", err);
    throw err;
  }
};

// * return available points for the user
const getCurrentUserPointsAvailable = async (req, res) => {
  const response = createResponse();
  const { userId } = req.params;

  try {
    const availablePoints = await calculateCurrentUserPointsAvailable(userId);
    response.success = true;
    response.availablePoints = { availablePoints };
    response.message = "User's available points calculated successfully!";
    return res.json(response);
  } catch (err) {
    response.message = "Error calculating available points";
    return res.status(500).json(response);
  }
};

// * get all reward claim record
const getAllUsersRewardClaimHistory = async (req, res) => {
  const response = createResponse();
  try {
    // * for filter
    const { userName } = req.query;
    // * create filter obj dynamically
    let filter = {};
    if (userName) {
      // * for searching in multiple fields with a match anywhere, case-insensitive
      filter["$or"] = [
        {
          "userInfo.personalInfo.firstName": {
            $regex: userName,
            $options: "i",
          },
        },
        {
          "userInfo.personalInfo.middleName": {
            $regex: userName,
            $options: "i",
          },
        },
        {
          "userInfo.personalInfo.lastName": { $regex: userName, $options: "i" },
        },
      ];
    }
    let allusersrewardclaimhistory = await rewardClaimModel.aggregate([
      {
        $lookup: {
          from: "users", // * match the collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo", // * unwind to treat the array as an object
      },
      {
        $match: filter, // * filter based on the user name
      },
      {
        $project: {
          bottleCount: 1,
          pointsAccumulated: 1,
          dateDisposed: 1,
          "userInfo.personalInfo.firstName": 1,
          "userInfo.personalInfo.middleName": 1,
          "userInfo.personalInfo.lastName": 1,
        },
      },
    ]);
    response.message = "all reward claim record retrieved successfully!";
    response.success = true;
    response.allusersrewardclaimhistory = allusersrewardclaimhistory;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * get one reward claim record
const getOneUserRewardClaimHistory = async (req, res) => {
  const response = createResponse();
  try {
    const userId = req.params.userId;
    let userrewardclaimhistory = await rewardClaimModel.find({
      userId: userId,
    });
    response.message = "user reward claim record retrieved successfully!";
    response.success = true;
    response.userrewardclaimhistory = userrewardclaimhistory;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * add a new reward claim record
const claimReward = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { userId, rewardId /*, pointsSpent*/ } = req.body;

    // * validate the req body first before anything
    if (!userId || !rewardId /*|| !pointsSpent*/) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * check if the current points of the user is sufficient to claim the reward
    let userPoints = await calculateCurrentUserPointsAvailable(userId);
    let pointsRequired = await getPointsRequiredForReward(rewardId);

    if (userPoints < pointsRequired) {
      response.message = "Insufficient points!";
      return res.json(response);
    }

    // ? testing purposes only
    if (userPoints && pointsRequired) {
      console.log("curr user points:", userPoints);
      console.log("points needed:", pointsRequired);
    }

    // * check if stocks available is sufficient
    let stocks = await getStockAvailableForReward(rewardId);
    if (stocks <= 0) {
      response.message = "Insufficient stock for this reward!";
      return res.json(response);
    }

    // * update stock
    await updateRewardStocks(--stocks, rewardId);

    // * adding a new claimed rewards record in the reward claim collection
    await rewardClaimModel.create({
      userId,
      rewardId,
      pointsSpent: pointsRequired,
    });

    response.message = "Rewards claimed history successfully saved!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR:", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * update reward claim record
const updateRewardClaim = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { userId, rewardId, pointsSpent } = req.body;
    const _id = req.params.id;

    // * validate the req body first before anything
    if (!_id || !userId || !rewardId || !pointsSpent) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * updating a disposed bottle record in the disposal collection
    await rewardClaimModel.findByIdAndUpdate(_id, {
      userId,
      rewardId,
      pointsSpent,
    });

    response.message = "Reward claim record successfuly updated!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * delete reward claim record
const removeRewardClaim = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    const deletedRewardClaimed = await rewardClaimModel.findByIdAndDelete(_id);
    if (deletedRewardClaimed) {
      response.message = "Reward claim record successfuly deleted!";
      response.success = true;
    } else {
      response.message = "Reward claim record does not exists!";
      response.success = false;
    }
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * delete reward claim record per user
const removeUserRewardClaim = async (req, res) => {
  const response = createResponse();
  try {
    const userId = req.params.userId;
    const deletedRewardClaimRecords = await rewardClaimModel.deleteMany({
      userId: userId,
    });
    if (deletedRewardClaimRecords.deletedCount > 0) {
      response.message =
        "All reward claim records for the user have been successfully deleted!";
      response.success = true;
    } else {
      response.message = "No disposed bottle records found for the user!";
      response.success = false;
    }
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

export {
  disposeBottle,
  claimReward,
  getAllUsersDisposedBottleHistory,
  getOneUserDisposedBottleHistory,
  getAllUsersRewardClaimHistory,
  getOneUserRewardClaimHistory,
  updateDisposedBottle,
  removeDisposedBottle,
  updateRewardClaim,
  removeRewardClaim,
  removeUserDisposedBottle,
  removeUserRewardClaim,
  getUserBottleDisposalCount,
  getCurrentUserPointsAvailable,
};
