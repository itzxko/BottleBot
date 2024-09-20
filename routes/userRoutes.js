import express from "express";
import { register, update, remove, getOne, getAll } from "../controllers/userController.js";

const userRoutes = express.Router();

// * get all
userRoutes.get("/", getAll);

// * get one
userRoutes.get("/:id", getOne);

// * add
userRoutes.post("/register", register);

// * update
userRoutes.put("/:id", update);

// * delete
userRoutes.delete("/:id", remove);

export default userRoutes;