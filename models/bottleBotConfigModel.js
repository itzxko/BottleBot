import mongoose from "mongoose";

const bottleBotConfigSchema = new mongoose.Schema({
  defaultLocation: {
    locationName: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
  },
  bottleExchange: {
    baseWeight: {
      type: Number,
      default: 1,
    },
    baseUnit: {
      type: String,
      enum: ["kg", "g", "lb"],
      default: "kg",
    },
    equivalentInPoints: {
      type: Number,
      default: 1,
    },
  },
});

export const bottleBotConfigModel = mongoose.model(
  "bottleBotConfig",
  bottleBotConfigSchema
);
