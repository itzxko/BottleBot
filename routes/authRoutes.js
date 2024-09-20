import express from "express";
import {
  innerRoute,
  login,
  setJWTUsername,
  getJWTUsername,
} from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);

// ? testing jwt
authRoutes.get("/login/:username", setJWTUsername);
authRoutes.get("/username", authenticateJWT, getJWTUsername);
authRoutes.get("/inner", authenticateJWT, innerRoute);

export default authRoutes;
