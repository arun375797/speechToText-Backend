import mongoose from "mongoose";
import * as mm from "music-metadata";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const TranscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  filePath: String,
  transcription: String,
  language: String,
  createdAt: { type: Date, default: Date.now },
  duration: Number, // Minutes
  cost: Number, // INR, supports decimals
});

TranscriptionSchema.statics.transcribeAndSave = async function (userId, file, language) {
  const filePath = file.path;
  const selectedLanguage = language || "auto";

  // Get audio duration (in seconds)
  const metadata = await mm.parseFile(filePath);
  const durationInSeconds = Math.round(metadata.format.duration || 0);
  const durationInMinutes = Math.ceil(durationInSeconds / 60); // Billing in minutes

  // Calculate cost based on Whisper API ($0.006/min) and convert to INR
  const costInUSD = durationInMinutes * 0.006;
  const costInINR = Math.round(costInUSD * 84 * 1.5 * 100) / 100; // 50% markup, ₹84/USD

  // Prepare form data for Whisper
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath), {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  formData.append("model", "whisper-1");

  if (selectedLanguage !== "auto") {
    formData.append("language", selectedLanguage);
  }

  // Send to OpenAI Whisper
  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const transcriptionText = response.data.text;

  // Create and save transcription
  const transcription = await this.create({
    userId,
    filePath,
    transcription: transcriptionText,
    language: selectedLanguage,
    duration: durationInMinutes,
    cost: costInINR,
  });

  // Cleanup uploaded file
  fs.unlink(filePath, (err) => {
    if (err) console.error("File cleanup failed:", err);
  });

  return {
    transcription,
    duration: durationInMinutes,
    cost: costInINR,
  };
};

TranscriptionSchema.statics.findByUserId = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

TranscriptionSchema.statics.deleteByIdAndUserId = function (id, userId) {
  return this.findOneAndDelete({ _id: id, userId });
};

TranscriptionSchema.statics.saveLive = function (userId, transcriptionText) {
  return this.create({
    userId,
    transcription: transcriptionText,
    filePath: null,
  });
};

export default mongoose.model("Transcription", TranscriptionSchema);