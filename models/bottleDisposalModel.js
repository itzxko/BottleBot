import mongoose from "mongoose";

const bottleDisposalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  bottleCount: { type: Number, required: true },
  pointsAccumulated: { type: Number, required: true },
  dateDisposed: { type: Date, default: Date.now },
});

export const bottleDisposalModel = mongoose.model("Disposal", bottleDisposalSchema);
