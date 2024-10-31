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
  validFrom: {
    type: Date,
    required: true,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  archiveDate: {
    type: Date,
    default: null,
  },
});

export const rewardModel = mongoose.model("Rewards", rewardSchema);
