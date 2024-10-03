import { createResponse } from "../utils/response.js";
import { bottleBotQueueModel } from "../models/bottleBotQueueModel.js";

// * add new request on queue
const addToQueue = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { userId, location } = req.body;

    // * validate the req body first before anything
    if (!userId || !location) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * adding a request in the queue collection
    await bottleBotQueueModel.create({
      userId,
      location,
    });

    const sortedQueue = await updateQueuing();

    response.sortedQueue = sortedQueue;
    response.message = "Request has been queued!";
    response.success = true;
    res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * when the user is already done/finish, delete the queue on database
const removeToQueue = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    const deletedQueuedRequest = await bottleBotQueueModel.findByIdAndDelete(
      _id
    );
    if (deletedQueuedRequest) {
      const sortedQueue = await updateQueuing();
      response.message = "Queued request successfuly removed!";
      response.success = true;
      response.sortedQueue = sortedQueue;
    } else {
      response.message = "Queued request does not exists!";
      response.success = false;
    }
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * update status of the first in queue based on request time
const updateQueuing = async () => {
  try {
    // * check for an existing in-progress request
    const inProgressRequest = await bottleBotQueueModel.findOne({
      status: "in progress",
    });

    // * only update if there isn't an in-progress request
    if (!inProgressRequest) {
      // * Find the first pending request sorted by createdAt and update its status
      const firstRequest = await bottleBotQueueModel
        .findOne({ status: "pending" })
        .sort({ createdAt: 1 });

      if (firstRequest) {
        await bottleBotQueueModel.findByIdAndUpdate(
          firstRequest._id, // * update the specific first pending request
          { status: "in progress" } // * update its status
        );
      }
    }

    // * Sort queue by request time
    const sortedQueue = await bottleBotQueueModel.find().sort({ createdAt: 1 });

    return sortedQueue;
  } catch (error) {
    console.error("ERROR", error);
  }
};
export { addToQueue, removeToQueue };
