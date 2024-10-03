import mongoose from "mongoose";

const bottleBotQueueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  location: {
    lat: { type: String, required: true },
    lon: { type: String, required: true },
    locationName: { type: String, required: true },
  },
  requestTime: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "in progress", "completed"],
    default: "pending",
  },
});

export const bottleBotQueueModel = mongoose.model(
  "NavigationQueue",
  bottleBotQueueSchema
);
