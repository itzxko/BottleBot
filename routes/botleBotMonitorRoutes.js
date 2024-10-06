import express from "express";
import WebSocket from "ws";
import { createResponse } from "../utils/response.js";

// * import wss object exported from server.js
import { wss } from "../server.js";

const bottleBotMonitorRoutes = express.Router();

const monitor = async (req, res) => {
  const data = req.body; // Assume data comes from somewhere
  // * STEP 4 WS - notify clients (frontend) connected on web socket
  realtime(data); // Call monitor with the received data

  const response = createResponse();
  response.message = "Data processed";
  response.success = "true";
  return res.json(response);
};

// * STEP 4 WS - once post request received from nodemcu,
// * notify clients (frontend) connected on web socket
const realtime = async (data) => {
  console.log("Data received:", data);

  // Send the data to all connected clients
  // * return the data to the client (frontend)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const response = createResponse();
      response.realTimeType = "botstate";
      response.message = "New data received";
      response.data = data;
      response.success = true;
      client.send(JSON.stringify(response));
    }
  });
};

// * STEP 3 WS - get post requests from nodemcu
bottleBotMonitorRoutes.post("/", monitor);

// ! NOTE : for real-time monitoring, WebSockets will be used
// ! npm install ws

export default bottleBotMonitorRoutes;
