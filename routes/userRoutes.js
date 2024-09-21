import express from "express";
import { registerUser, updateUser, removeUser, getOneUser, getAllUsers } from "../controllers/userController.js";

const userRoutes = express.Router();

// * get all
userRoutes.get("/", getAllUsers);

// * get one
userRoutes.get("/:id", getOneUser);

// * add
userRoutes.post("/register", registerUser);

// * update
userRoutes.put("/:id", updateUser);

// * delete
userRoutes.delete("/:id", removeUser);

export default userRoutes;