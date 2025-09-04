import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    filename: String,
    transcription: String,   // <-- text content
    duration: Number,        // minutes
    cost: Number,            // INR (or whatever you store)
  },
  { timestamps: true }
);

export default mongoose.models.Transcription ||
  mongoose.model("Transcription", transcriptionSchema);
