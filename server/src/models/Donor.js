import mongoose from "mongoose";

const donorSchema = new mongoose.Schema({
  googleId: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    required: function () {
      return !this.googleId; // Name required if not Google login
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    default: null, // Google login has no password
  },
  profileImage: {
    type: String,
    default: "", // store Google profile picture URL
  },
  avatar: {
    type: String,
    default: "", // store uploaded/chosen avatar URL
  },
  contactNumber: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },

  // 👇 Add these for password reset
  resetCode: {
    type: String,
    default: null,
  },
  resetCodeExpire: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Donor", donorSchema);
