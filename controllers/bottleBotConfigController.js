import { bottleBotConfigModel } from "../models/bottleBotConfigModel.js";
import { createResponse } from "../utils/response.js";

// * check if the configs are already set
const getBottleBotConfig = async () => {
  try {
    const isSet = await bottleBotConfigModel.findOne();
    if (isSet) {
      return {
        success: true,
        message: "There are already existing configurations",
        config: isSet,
      };
    } else {
      return {
        success: false,
        message: "There are no existing configurations",
      };
    }
  } catch (err) {
    console.error("Error checking if bottle bot configs exist", err);
    return { success: false, message: "Internal server error" };
  }
};

const isBottleBotConfigSet = async (req, res) => {
  const response = createResponse();
  const result = await getBottleBotConfig();

  response.message = result.message;
  response.success = result.success;
  response.config = result.config;

  return res.json(response);
};


// * calculate equivalent points of one bottle based on weight
const getEquivalentInPointsBasedOnWeight = async (req, res) => {
  const response = createResponse();
  let points = 0;
  try {
    const bottleWeight = req.params.bottleWeight;
    const set = await getBottleBotConfig();
    if (set) {
      // * assuming that the bottle weight and config base weight are the same
      const { baseWeight, equivalentInPoints } = set.config.bottleExchange;
      points = (bottleWeight / baseWeight) * equivalentInPoints;
      response.message = "Equivalent points calculated!";
      response.success = true;
    } else {
      response.message = "Cannot calculate points!";
      response.success = false;
    }
    response.points = points;
    return res.json(response);
  } catch (error) {
    response.message = error;
    response.success = false;
    console.error(error);
    return res.json(response);
  }
};

// * set bottle bot config
const setBottleBotConfig = async (req, res) => {
  const response = createResponse();

  try {
    const isSet = await getBottleBotConfig();
    if (isSet.success) {
      response.message = isSet.message;
      response.success = isSet.success;
      return res.json(response);
    }

    // * destructure for easier access
    const { defaultLocation, bottleExchange } = req.body;

    // * validate the req body first before anything
    if (
      !defaultLocation.locationName ||
      !defaultLocation.lat ||
      !defaultLocation.lon ||
      !bottleExchange.baseWeight ||
      !bottleExchange.baseUnit ||
      !bottleExchange.equivalentInPoints
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * adding a new config in the config collection
    await bottleBotConfigModel.create({
      defaultLocation,
      bottleExchange,
    });

    response.message = "BottleBot Config successfully saved!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * update bottle bot config
const updateBottleBotConfig = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { defaultLocation, bottleExchange } = req.body;
    const _id = req.params.id;

    // * validate the req body first before anything
    if (
      !_id ||
      !defaultLocation.locationName ||
      !defaultLocation.lat ||
      !defaultLocation.lon ||
      !bottleExchange.baseWeight ||
      !bottleExchange.baseUnit ||
      !bottleExchange.equivalentInPoints
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * updating a reward in the reward collection
    await bottleBotConfigModel.findByIdAndUpdate(_id, {
      defaultLocation,
      bottleExchange,
    });

    response.message = "BottleBot Config successfuly updated!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

export {
  setBottleBotConfig,
  updateBottleBotConfig,
  isBottleBotConfigSet,
  getEquivalentInPointsBasedOnWeight,
};
