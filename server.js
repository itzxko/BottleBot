import express from "express";
import userRoutes from "./routes/userRoute.js";
import dotenv from "dotenv";
import multer from "multer";
import { tryMongoDBAtlasConnection } from "./config/database.js";

let app = express();
app.listen(8080);

// * middlewares
const upload = multer();
dotenv.config();
app.use(upload.array());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// * trying to connect on database using mongoose
tryMongoDBAtlasConnection();

// * use the user routes
app.use("/api/user", userRoutes);

// * start server
app.get("/", (req, res) => {
  res.send("Server Started");
});