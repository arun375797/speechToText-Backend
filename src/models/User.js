import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    name: String,
    email: { type: String, unique: true, sparse: true },
    picture: String,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
