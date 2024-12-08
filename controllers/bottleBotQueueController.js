import { createResponse } from "../utils/response.js";
import { bottleBotQueueModel } from "../models/bottleBotQueueModel.js";
import { wss } from "../server.js";
import WebSocket from "ws";
import { bottleBotConfigModel } from "../models/bottleBotConfigModel.js";
import { userModel } from "../models/userModel.js";

// TODO: TEST TOM ON WEBSOCKET AND NODEMCU!!!!!!!!!!!!!!!!!!!

// * add new request on queue
const addToQueue = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    let { userId, location, returnToDefault } = req.body;
    if (returnToDefault === "true") {
      const config = await bottleBotConfigModel.findOne();
      const superAdmin = await userModel.findOne({
        "credentials.level": "admin",
      });
      location = config.defaultLocation;
      userId = superAdmin._id;
      // * delete all in queue
      const deleteAllQueue = await bottleBotQueueModel.deleteMany({});
      if (deleteAllQueue) {
        console.log("ALL QUEUE DELETED!");
      }
    }

    console.log("ADDED TO QUEUE");

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

    // * call ws function to notify frontend
    updateRealtime(sortedQueue);

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
    console.log("REMOVED FROM QUEUE");

    const _id = req.params.id;
    const deletedQueuedRequest = await bottleBotQueueModel.findByIdAndDelete(
      _id
    );
    if (deletedQueuedRequest) {
      const sortedQueue = await updateQueuing();
      response.message = "Queued request successfuly removed!";
      response.success = true;
      response.sortedQueue = sortedQueue;
      // * call ws function to notify frontend
      updateRealtime(sortedQueue);
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
        console.log("CURRENT FIRST IN QUEUE UPDATED");
      }
    }

    // * Sort queue by request time
    const sortedQueue = await bottleBotQueueModel
      .find()
      .sort({ createdAt: 1 })
      .populate({
        path: "userId",
        select: "personalInfo",
      });

    // * call ws function to notify frontend
    updateRealtime(sortedQueue);

    return sortedQueue;
  } catch (error) {
    console.error("ERROR", error);
  }
};

// * real-time updates on frontend
const updateRealtime = async (data) => {
  // * Send the data to all connected clients
  // * return the data to the client (frontend)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const response = createResponse();
      response.realTimeType = "queue";
      response.message = "Updated queue received";
      response.data = data;
      response.success = true;
      client.send(JSON.stringify(response));
    }
  });
};

export { addToQueue, removeToQueue };
