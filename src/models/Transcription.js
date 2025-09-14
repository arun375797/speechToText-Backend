import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // Keep for backward compatibility
    filename: String,
    transcription: String,   // <-- text content
    text: String,            // Alternative field name
    duration: Number,        // minutes
    cost: Number,            // INR (or whatever you store)
    language: String,        // Language used for transcription
    fileSize: Number,        // File size in bytes
    processingTime: Number,  // Processing time in seconds
  },
  { timestamps: true }
);

export default mongoose.models.Transcription ||
  mongoose.model("Transcription", transcriptionSchema);
