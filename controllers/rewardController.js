import { rewardModel } from "../models/rewardModel.js";
import { createResponse } from "../utils/response.js";

// const uploadRewardImage = () => {};

// const removeRewardImage = () => {};

// const updateRewardImage = () => {};

const add = async (req, res) => {
  const response = createResponse();

  try {
    // * destructure for easier access
    const { rewardName, rewardDescription, pointsRequired, stocks, category } =
      req.body;

    const image = req.file.filename;
    console.log(req.file);

    // * validate the req body first before anything
    if (
      !rewardName ||
      !rewardDescription ||
      !pointsRequired ||
      !stocks ||
      !category ||
      !image
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * adding a new reward in the User collection
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

// const update = async () => {};

// const remove = async () => {};

export { add };
