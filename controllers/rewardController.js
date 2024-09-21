import { rewardModel } from "../models/rewardModel.js";
import { createResponse } from "../utils/response.js";
import fs from "fs";

// * get pointsRequired for a specific reward by ID
const getPointsRequiredForReward = async (rewardId) => {
  try {
    const reward = await rewardModel.findById(rewardId, "pointsRequired");

    if (!reward) {
      throw new Error("Reward not found");
    }

    return reward.pointsRequired;
  } catch (err) {
    console.error("Error retrieving pointsRequired for reward:", err);
    throw err;
  }
};

// * check if reward is a duplicate
const isRewardAlreadyExists = async (rewardName, rewardId) => {
  try {
    return await rewardModel.findOne({
      rewardName: rewardName,
      _id: {
        $ne: rewardId, // * checks that the ID does not match if provided
      },
    });
  } catch (err) {
    console.error("Error checking if reward exists", err);
    throw err;
  }
};

// * removing the reward image in uploads folder
const removeRewardImage = (image) => {
  const filePath = "./uploads/" + image;
  fs.unlink(filePath, (err) => {
    if (err) console.error("Failed to delete file:", err);
  });
};

const updateReward = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { rewardName, rewardDescription, pointsRequired, stocks, category } =
      req.body;
    const _id = req.params.id;

    console.log("req detected");

    // * validate the req body first before anything
    if (
      !_id ||
      !rewardName ||
      !rewardDescription ||
      !pointsRequired ||
      !stocks ||
      !category
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    let image = null;
    let updatedReward = {
      rewardName: rewardName,
      rewardDescription: rewardDescription,
      pointsRequired: pointsRequired,
      stocks: stocks,
      category: category,
    };

    // * checking for duplicate
    let isRewardExists = await isRewardAlreadyExists(rewardName, _id);

    const isImageChanged = req.body.imageChanged;
    if (isImageChanged === "true") {
      // * ensure the image was uploaded successfully
      if (!req.file || !req.file.filename) {
        response.message = "Image upload failed or missing!";
        return res.status(400).json(response);
      }
      image = req.file.filename;
      if (!isRewardExists) {
        // * only allow deletion of prev image if it is not detected as duplicate
        removeRewardImage(req.body.prevImageString);
      }
      updatedReward.image = image;
    }

    if (isRewardExists) {
      // * delete the uploaded file if it's a duplicate
      // * bc we're using multer as middleware it will upload
      // * the file first before going to this function
      if (image) {
        removeRewardImage(image);
      }
      response.message = "This reward is already added";
      return res.json(response);
    }

    // * updating a reward in the reward collection
    await rewardModel.findByIdAndUpdate(_id, updatedReward);

    response.message = "Reward successfuly updated!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * getting all rewards
const getAllRewards = async (req, res) => {
  const response = createResponse();
  try {
    let rewards = await rewardModel.find({});
    response.message = "All rewards retrieved successfully!";
    response.success = true;
    response.rewards = rewards;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * getting one reward
const getOneReward = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    let reward = await rewardModel.findOne({ _id: _id });
    response.message = "Reward retrieved successfully!";
    response.success = true;
    response.reward = reward;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * adding rewards
const addReward = async (req, res) => {
  const response = createResponse();

  try {
    // * destructure for easier access
    const { rewardName, rewardDescription, pointsRequired, stocks, category } =
      req.body;

    console.log(req.file.filename);
    console.log(req.body);

    // * validate the req body first before anything
    if (
      !rewardName ||
      !rewardDescription ||
      !pointsRequired ||
      !stocks ||
      !category
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * ensure the image was uploaded successfully after the duplicate check
    if (!req.file || !req.file.filename) {
      response.message = "Image upload failed or missing!";
      return res.status(400).json(response);
    }

    const image = req.file.filename;

    // * checking for duplicate
    let isRewardExists = await isRewardAlreadyExists(rewardName);

    if (isRewardExists) {
      // * delete the uploaded file if it's a duplicate
      // * bc we're using multer as middleware it will upload
      // * the file first before going to this function
      if (image) {
        removeRewardImage(image);
      }
      response.message = "This reward is already added";
      return res.json(response);
    }

    // * adding a new reward in the reward collection
    await rewardModel.create({
      rewardName,
      rewardDescription,
      image,
      pointsRequired,
      stocks,
      category,
    });

    response.message = "Reward successfully created!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * remove
const removeReward = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    const deletedReward = await rewardModel.findByIdAndDelete(_id);
    if (deletedReward) {
      removeRewardImage(deletedReward.image);
      response.message = "Reward successfuly deleted!";
      response.success = true;
    } else {
      response.message = "Reward does not exists!";
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
  addReward,
  getAllRewards,
  getOneReward,
  updateReward,
  removeReward,
  getPointsRequiredForReward,
};
