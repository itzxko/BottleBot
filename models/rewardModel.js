import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  rewardName: {
    type: String,
    required: true,
  },
  rewardDescription: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  pointsRequired: {
    type: Number,
    required: true,
  },
  stocks: {
    type: Number,
    default: 0,
    required: true,
  },
  category: {
    type: String,
    enum: ["Goods", "Clothing", "Beverage", "Other"],
    required: true,
  },
});

export const rewardModel = mongoose.model("Rewards", rewardSchema);
