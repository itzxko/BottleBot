import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import { tryMongoDBAtlasConnection } from "./config/database.js";
import { rewardRoutes } from "./routes/rewardRoutes.js";

let app = express();
app.listen(8080);

// * middlewares
dotenv.config();
app.use(express.json());

// ! this can cause issue when uploading a file and idk why :)
app.use(express.urlencoded({ extended: true }));

app.use(cors());

console.log("SERVER CALLED");

// * dir for images
app.use("/images", express.static("uploads"));

// * trying to connect on database using mongoose
tryMongoDBAtlasConnection();

// * use the user routes
app.use("/api/users", userRoutes);

// * use the auth routes for login/logout
app.use("/api/auth", authRoutes);

// * use reward routes for reward related requests
app.use("/api/rewards", rewardRoutes);

// * start server
app.get("/", (req, res) => {
  res.send("Server Started");
});
