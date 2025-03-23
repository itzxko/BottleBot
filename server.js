import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import { tryMongoDBAtlasConnection } from "./config/database.js";
import { rewardRoutes } from "./routes/rewardRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import bottleBotConfigRoutes from "./routes/bottleBotConfigRoutes.js";
import bottleBotMonitorRoutes from "./routes/botleBotMonitorRoutes.js";

import { WebSocketServer } from "ws";
import { createResponse } from "./utils/response.js";
import bottleBotQueueRoutes from "./routes/bottleBotQueueRoutes.js";
import reportsRoutes from "./controllers/reportsRoutesController.js";

let app = express();
const PORT = 8080;
const server = app.listen(PORT);

// * STEP 1 WS - setup the web socket connection
// * connect fe using url (ws://localhost:PORT_HERE)
const wss = new WebSocketServer({ server });

// * middlewares
dotenv.config();
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

// * trying to connect on database using mongoose
await tryMongoDBAtlasConnection();

// * dir for images
app.use("/api/images", express.static("uploads"));

// * use the user routes
app.use("/api/users", userRoutes);

// * use the auth routes for login/logout
app.use("/api/auth", authRoutes);

// * use reward routes for reward related requests
app.use("/api/rewards", rewardRoutes);

// * history routes for rewards claimed and bottle disposed
app.use("/api/history", historyRoutes);

// * config routes for configurations set by admin
app.use("/api/configurations", bottleBotConfigRoutes);

// * routes to receive req for real-time bot monitoring
app.use("/api/monitor", bottleBotMonitorRoutes);

// * STEP 2 WS - connect the client (frontend)
// * to the websocket connection for real-time updates
wss.on("connection", (ws) => {
  console.log("Client connected");

  // * if fe sends some message/data it will log here
  ws.on("message", (message) => {
    console.log("Received Message:", JSON.parse(message));
    // * after receiving some data u can also return some message on the backend
    const response = createResponse();
    response.realTimeType = "ws connection";
    response.message = "Message received, this is a response from backend";
    response.success = true;
    ws.send(JSON.stringify(response));
  });
});

// * routes to receive request for queuing
app.use("/api/queue", bottleBotQueueRoutes);

// * routes to get reports
app.use("/api/reports", reportsRoutes);

// * start server
app.get("/", (req, res) => {
  res.send("Server Started");
});

// * to be accessible in websocket routes
export { wss };
