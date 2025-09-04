

import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;

mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
