import mongoose from "mongoose";

let userSchema = new mongoose.Schema({
  // _id: {
  //   type: Number,
  //   required: true,
  // },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// * automatically creates a collection in the database
export const userModel = mongoose.model("Users", userSchema);
