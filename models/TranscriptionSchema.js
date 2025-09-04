const TranscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  filePath: String,          // local path or cloud storage URL
  transcription: String,     // text result
  createdAt: { type: Date, default: Date.now },
 duration: Number, // Minutes
  cost: Number, // INR, supports decimals
});

export const Transcription = mongoose.model("Transcription", TranscriptionSchema);
