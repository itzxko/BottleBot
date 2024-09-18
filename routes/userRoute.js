import express from "express";
import {
  getJWTUsername,
  innerRoute,
  login,
  register,
  setJWTUsername,
} from "../controllers/userController.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", register);
userRoutes.post("/login", login);

userRoutes.get("/login/:username", setJWTUsername);
userRoutes.get("/username", authenticateJWT, getJWTUsername);

// ? testing jwt
userRoutes.get("/inner", authenticateJWT, innerRoute);

export default userRoutes;
