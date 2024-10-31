import mongoose from "mongoose";

const rewardClaimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rewards",
    required: true,
  },
  pointsSpent: { type: Number, required: true },
  dateClaimed: { type: Date, default: Date.now },
  archiveDate: {
    type: Date,
    default: null,
  },
});

export const rewardClaimModel = mongoose.model(
  "RewardClaim",
  rewardClaimSchema
);
