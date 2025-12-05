import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  displayName: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePhoto: String,
  role: {
    type: String,
    enum: ["donor", "admin"],
    default: "donor",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
