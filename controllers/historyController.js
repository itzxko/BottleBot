import mongoose from "mongoose";
import { bottleDisposalModel } from "../models/bottleDisposalModel.js";
import { rewardClaimModel } from "../models/rewardClaimModel.js";
import { createResponse } from "../utils/response.js";
import {
  getPointsRequiredForReward,
  getStockAvailableForReward,
  updateRewardStocks,
  getRewardStatus,
  isClaimDateValid,
} from "./rewardController.js";
import { getBottleBotConfig } from "./bottleBotConfigController.js";

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
    // * for pagination, default to 1 and limit to 3
    const {
      page = 1,
      limit = 3,
      userName,
      status,
      startDate,
      endDate,
    } = req.query;

    // * converting page and limit to integer to avoid exceptions
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

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

    if (status && status === "active") {
      filter.archiveDate = null; // * only get records that has not been archived yet
    } else if (status && status === "archived") {
      filter.archiveDate = { $ne: null }; // * only get records that's already been archived
    }

    if (startDate && endDate) {
      filter.dateDisposed = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // * use aggregation to lookup user details and filter based on name
    const [allusersdisposalhistory, totalCount] = await Promise.all([
      bottleDisposalModel.aggregate([
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
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: limitNumber },
        {
          $project: {
            bottleCount: 1,
            pointsAccumulated: 1,
            dateDisposed: 1,
            archiveDate: 1,
            userId: 1,
            "userInfo.personalInfo.firstName": 1,
            "userInfo.personalInfo.middleName": 1,
            "userInfo.personalInfo.lastName": 1,
          },
        },
      ]),
      bottleDisposalModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: "$userInfo",
        },
        {
          $match: filter,
        },
        { $count: "count" },
      ]),
    ]);

    // * get total count of documents/row based on the filter
    const count = totalCount.length > 0 ? totalCount[0].count : 0;
    console.log("totalCount", count);

    // * calculate the total pages based on the set limit
    const totalPages = Math.ceil(count / limitNumber);

    response.message = "all disposal record retrieved successfully!";
    response.success = true;
    response.allusersdisposalhistory = allusersdisposalhistory;
    response.totalPages = totalPages;
    response.currentPage = pageNumber;

    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * get one user disposal record
const getOneUserDisposedBottleHistory = async (req, res) => {
  const response = createResponse();
  try {
    // * for pagination, default to 1 and limit to 3
    const { page = 1, limit = 3, status, startDate, endDate } = req.query;
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    // * converting page and limit to integer to avoid exceptions
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    let filter = {
      userId,
    };
    if (status && status === "active") {
      filter.archiveDate = null; // * only get records that has not been archived yet
    } else if (status && status === "archived") {
      filter.archiveDate = { $ne: null }; // * only get records that's already been archived
    }

    if (startDate && endDate) {
      filter.dateDisposed = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }
    console.log(filter);

    let userdisposalhistory = await bottleDisposalModel
      .find(filter)
      .limit(limitNumber * 1)
      .skip((pageNumber - 1) * limitNumber)
      .exec();

    // * get total count of documents/row based on the filter
    const totalCount = await bottleDisposalModel.countDocuments(filter);

    // * calculate the total pages based on the set limit
    const totalPages = Math.ceil(totalCount / limitNumber);

    response.message = "user disposal record retrieved successfully!";
    response.success = true;
    response.userdisposalhistory = userdisposalhistory;
    response.totalPages = totalPages;
    response.currentPage = pageNumber;

    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * get one disposal record
const getOneDisposedBottleHistory = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;

    let oneDisposalhistory = await bottleDisposalModel.findOne({ _id: _id });
    response.message = "One disposal record retrieved successfully!";
    response.success = true;
    response.oneDisposalhistory = oneDisposalhistory;

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
    const { userId, bottleCount } = req.body;

    // * validate the req body first before anything
    if (!userId || !bottleCount) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    const configurations = await getBottleBotConfig();
    let pointsAccumulated = 0;
    pointsAccumulated =
      bottleCount * configurations.config.bottleExchange.equivalentInPoints;
    console.log(pointsAccumulated);

    // * adding a new disposed bottle record in the disposal collection
    const newRecord = await bottleDisposalModel.create({
      userId,
      bottleCount,
      pointsAccumulated,
    });

    console.log(newRecord);

    // ? testing purposes only
    let count = await calculateUserBottleDisposalCount(userId);
    if (count) {
      console.log("disposed bottle count : ", count);
    }

    response.message = "Bottle Disposal history successfully saved!";
    response.success = true;
    response.transactId = newRecord._id;
    response.pointsAccumulated = pointsAccumulated;

    return res.json(response);
  } catch (error) {
    console.error("ERROR:", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * update disposal record
const updateDisposedBottle = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { userId, bottleCount, pointsAccumulated, archiveDate } = req.body;
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
      archiveDate,
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
    // const deletedDisposedBottle = await bottleDisposalModel.findByIdAndDelete(
    //   _id
    // );
    // if (deletedDisposedBottle) {
    //   response.message = "Disposed bottle record successfuly deleted!";
    //   response.success = true;
    // } else {
    //   response.message = "Disposed bottle record does not exists!";
    //   response.success = false;
    // }

    // * archive instead of delete
    const archivedDisposedBottle = await bottleDisposalModel.findByIdAndUpdate(
      _id,
      {
        archiveDate: Date.now(),
      }
    );

    if (archivedDisposedBottle) {
      response.message = "Disposed bottle record has been archived!";
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
    // * for pagination, default to 1 and limit to 3
    const {
      page = 1,
      limit = 3,
      userName,
      status,
      startDate,
      endDate,
    } = req.query;

    // * converting page and limit to integer to avoid exceptions
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

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

    if (status && status === "active") {
      filter.archiveDate = null; // * only get users that has not been archived yet
    } else if (status && status === "archived") {
      filter.archiveDate = { $ne: null }; // * only get users that's already been archived
    }

    if (startDate && endDate) {
      filter.dateClaimed = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    console.log("Filter:", filter);
    console.log("Page:", pageNumber, "Limit:", limitNumber);

    // * aggregate for counting and fetching
    // * bc when filtering by username, counting documents return with filter is not
    const [allusersrewardclaimhistory, totalCount] = await Promise.all([
      rewardClaimModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
        { $match: filter },
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: limitNumber },
        {
          $project: {
            "userInfo.personalInfo.firstName": 1,
            "userInfo.personalInfo.middleName": 1,
            "userInfo.personalInfo.lastName": 1,
            _id: 1,
            userId: 1,
            rewardId: 1,
            pointsSpent: 1,
            dateClaimed: 1,
            archiveDate: 1,
          },
        },
      ]),
      rewardClaimModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
        { $match: filter },
        { $count: "count" },
      ]),
    ]);

    // * get total count of documents/row based on the filter
    const count = totalCount.length > 0 ? totalCount[0].count : 0;
    console.log("totalCount", count);

    // * calculate the total pages based on the set limit
    const totalPages = Math.ceil(count / limitNumber);

    response.message = "all reward claim record retrieved successfully!";
    response.success = true;
    response.allusersrewardclaimhistory = allusersrewardclaimhistory;
    response.totalPages = totalPages;
    response.currentPage = pageNumber;

    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * get one user reward claim record
const getOneUserRewardClaimHistory = async (req, res) => {
  const response = createResponse();
  try {
    // * for pagination, default to 1 and limit to 3
    const { page = 1, limit = 3, status, startDate, endDate } = req.query;
    const userId = req.params.userId;
    // * converting page and limit to integer to avoid exceptions
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    let filter = {
      userId,
    };

    if (status && status === "active") {
      filter.archiveDate = null; // * only get records that has not been archived yet
    } else if (status && status === "archived") {
      filter.archiveDate = { $ne: null }; // * only get records that's already been archived
    }

    if (startDate && endDate) {
      filter.dateClaimed = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    console.log(filter);

    let userrewardclaimhistory = await rewardClaimModel
      .find(filter)
      .limit(limitNumber * 1)
      .skip((pageNumber - 1) * limitNumber)
      .exec();

    // * get total count of documents/row based on the filter
    const totalCount = await rewardClaimModel.countDocuments(filter);

    // * calculate the total pages based on the set limit
    const totalPages = Math.ceil(totalCount / limitNumber);

    response.message = "user reward claim record retrieved successfully!";
    response.success = true;
    response.userrewardclaimhistory = userrewardclaimhistory;
    response.totalPages = totalPages;
    response.currentPage = pageNumber;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * get one reward claim record
const getOneRewardClaimHistory = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    let rewardclaimhistory = await rewardClaimModel.find({ _id: _id });
    response.message = "one reward claim record retrieved successfully!";
    response.success = true;
    response.rewardclaimhistory = rewardclaimhistory;
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

    // * check if reward status is active and if the date claimed is within the validity date
    let isRewardActive = (await getRewardStatus(rewardId)) === "active";
    let validClaimDate = await isClaimDateValid(rewardId, Date.now());

    if (!isRewardActive) {
      response.message = "This reward is not yet active.";
      return res.json(response);
    }

    if (!validClaimDate) {
      response.message = "Only valid from a certain period.";
      return res.json(response);
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
    const { userId, rewardId, pointsSpent, archiveDate } = req.body;
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
      archiveDate,
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
    // const deletedRewardClaimed = await rewardClaimModel.findByIdAndDelete(_id);
    // if (deletedRewardClaimed) {
    //   response.message = "Reward claim record successfuly deleted!";
    //   response.success = true;
    // } else {
    //   response.message = "Reward claim record does not exists!";
    //   response.success = false;
    // }

    // * archive instead of delete
    const archivedRewardClaimed = await rewardClaimModel.findByIdAndUpdate(
      _id,
      {
        archiveDate: Date.now(),
      }
    );
    if (archivedRewardClaimed) {
      response.message = "Reward claim record has been archived!";
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
  getOneDisposedBottleHistory,
  getOneRewardClaimHistory,
};
