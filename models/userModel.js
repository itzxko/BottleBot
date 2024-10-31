import mongoose from "mongoose";

let userSchema = new mongoose.Schema({
  // _id: {
  //   type: Number,
  //   required: true,
  // },
  personalInfo: {
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Widowed"],
      required: true,
    },
    nationality: { type: String, required: true },
  },
  contactInfo: {
    address: {
      houseNumber: { type: String, required: true },
      street: { type: String, required: true },
      barangay: { type: String, required: true },
      city: { type: String, required: true },
    },
    phoneNumbers: { type: [String] },
  },
  economicInfo: {
    employmentStatus: { type: String, required: true },
    occupation: { type: String, required: true },
  },
  credentials: {
    email: { type: String, required: true },
    password: { type: String, required: true },
    level: {
      type: String,
      default: "citizen",
      enum: ["citizen", "staff", "admin"],
      required: true,
    },
  },
  archiveDate: {
    type: Date,
    default: null,
  },
});

// * automatically creates a collection in the database
export const userModel = mongoose.model("Users", userSchema);
