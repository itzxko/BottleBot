import express from "express";
import { bottleDisposalModel } from "../models/bottleDisposalModel.js";
import { rewardClaimModel } from "../models/rewardClaimModel.js";
import { rewardModel } from "../models/rewardModel.js";
import { userModel } from "../models/userModel.js";

const reportsRoutes = express.Router();

const createResponse = (message, success, data = null) => ({
  message,
  success,
  data,
});

const parseDateRange = (req, res, next) => {
  let { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999); // Ensure the whole day is included

    req.dateFilter = {
      $or: [
        { dateDisposed: { $gte: start, $lte: end } },
        { dateClaimed: { $gte: start, $lte: end } },
      ],
    };

    console.log("Date Filter:", JSON.stringify(req.dateFilter, null, 2)); // Debugging output
  } else {
    req.dateFilter = {}; // No filter if no dates provided
  }

  next();
};

// Apply the middleware to all routes
reportsRoutes.use(parseDateRange);

// Total Bottles Collected Over Time
reportsRoutes.get("/total-collected", async (req, res) => {
  try {
    const total = await bottleDisposalModel.aggregate([
      { $match: req.dateFilter }, // Apply date filter
      { $group: { _id: null, totalBottles: { $sum: "$bottleCount" } } },
    ]);
    res.json(
      createResponse(
        "Total bottles collected retrieved successfully",
        true,
        total[0] || { totalBottles: 0 }
      )
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Top Contributors
reportsRoutes.get("/top-contributors", async (req, res) => {
  try {
    const topUsers = await bottleDisposalModel.aggregate([
      { $match: {} }, // Remove date filter for debugging
      {
        $group: {
          _id: "$userId",
          totalBottles: { $sum: "$bottleCount" },
        },
      },
      { $sort: { totalBottles: -1 } },
      { $limit: 10 }, // Increase limit to ensure more users show
      {
        $lookup: {
          from: "Users", // Ensure correct collection name
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $addFields: { userInfo: { $arrayElemAt: ["$userInfo", 0] } } },
      {
        $project: {
          _id: 1,
          totalBottles: 1,
          firstName: "$userInfo.personalInfo.firstName",
          lastName: "$userInfo.personalInfo.lastName",
          email: "$userInfo.credentials.email",
        },
      },
    ]);

    res.json(
      createResponse("Top contributors retrieved successfully", true, topUsers)
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Points Accumulated Over Time
reportsRoutes.get("/points-accumulated", async (req, res) => {
  try {
    const points = await bottleDisposalModel.aggregate([
      { $match: req.dateFilter }, // Apply date filter
      { $group: { _id: null, totalPoints: { $sum: "$pointsAccumulated" } } },
    ]);
    res.json(
      createResponse(
        "Total points accumulated retrieved successfully",
        true,
        points[0] || { totalPoints: 0 }
      )
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Total Rewards Claimed
reportsRoutes.get("/total-claimed", async (req, res) => {
  try {
    const totalClaims = await rewardClaimModel.aggregate([
      { $match: req.dateFilter }, // Apply date filter
      { $group: { _id: null, totalClaims: { $sum: 1 } } },
    ]);
    res.json(
      createResponse(
        "Total rewards claimed retrieved successfully",
        true,
        totalClaims[0] || { totalClaims: 0 }
      )
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Reward Stock Report
reportsRoutes.get("/stock-report", async (req, res) => {
  try {
    const stock = await rewardModel.find({}, "rewardName stocks");
    res.json(
      createResponse("Stock report retrieved successfully", true, stock)
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Most Redeemed Rewards
reportsRoutes.get("/most-redeemed", async (req, res) => {
  try {
    const mostRedeemed = await rewardClaimModel.aggregate([
      { $match: req.dateFilter }, // Apply date filter
      { $group: { _id: "$rewardId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    res.json(
      createResponse(
        "Most redeemed rewards retrieved successfully",
        true,
        mostRedeemed
      )
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Highest Points Spent on Rewards
reportsRoutes.get("/highest-points-spent", async (req, res) => {
  try {
    const highestPoints = await rewardClaimModel.aggregate([
      { $match: req.dateFilter }, // Apply date filter
      {
        $group: { _id: "$userId", totalPointsSpent: { $sum: "$pointsSpent" } },
      },
      { $sort: { totalPointsSpent: -1 } },
      { $limit: 5 },
    ]);
    res.json(
      createResponse(
        "Highest points spent retrieved successfully",
        true,
        highestPoints
      )
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// User Demographics
reportsRoutes.get("/demographics", async (req, res) => {
  try {
    const demographics = await userModel.aggregate([
      { $group: { _id: "$personalInfo.gender", count: { $sum: 1 } } },
    ]);
    res.json(
      createResponse(
        "User demographics retrieved successfully",
        true,
        demographics
      )
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

// Account Level Summary
reportsRoutes.get("/account-summary", async (req, res) => {
  try {
    const summary = await userModel.aggregate([
      { $group: { _id: "$credentials.level", count: { $sum: 1 } } },
    ]);
    res.json(
      createResponse("Account summary retrieved successfully", true, summary)
    );
  } catch (error) {
    res.status(500).json(createResponse(error.message, false));
  }
});

export default reportsRoutes;
