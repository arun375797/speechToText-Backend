import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as mm from "music-metadata";
import OpenAI from "openai";
import { toFile } from "openai/uploads";   // ✅ import helper
import Transcription from "../models/Transcription.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function getDurationSeconds(filePath) {
  try {
    const meta = await mm.parseFile(filePath);
    const sec = meta?.format?.duration;
    return Number.isFinite(sec) ? sec : 0;
  } catch {
    return 0;
  }
}

/**
 * POST /api/transcriptions
 * multipart/form-data with field "file"
 */
export const createTranscription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded (field name should be 'file')." });
    }

    // 1) Get duration
    const uploadedPath = req.file.path; // e.g. "uploads/xyz.m4a"
    const durationSec = await getDurationSeconds(uploadedPath);
    const billableMinutes = Math.max(
      1,
      Math.ceil((durationSec || 0) / 60)
    ); // min 1 minute

    // 2) Call OpenAI Whisper
    const language =
      req.body?.language && req.body.language !== "auto"
        ? req.body.language
        : undefined;

    // ✅ wrap the file with original name + type
    const fileForUpload = await toFile(
      fs.createReadStream(uploadedPath),
      req.file.originalname,
      { type: req.file.mimetype }
    );

    const transcriptionResp = await openai.audio.transcriptions.create({
      file: fileForUpload,
      model: "whisper-1",
      language, // undefined → auto-detect
      response_format: "json",
      temperature: 0,
    });

    const text = transcriptionResp?.text || "";

    // 3) Calculate cost
    const USD_PER_MIN = 0.006;
    const INR_PER_USD = 84;
    const MARKUP = 1.5;
    const costINR = round2(
      billableMinutes * USD_PER_MIN * INR_PER_USD * MARKUP
    );

    // 4) Save to DB
    const startTime = req.file.timestamp || Date.now();
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    // Ensure all numeric values are valid
    const safeProcessingTime = isNaN(processingTime) || processingTime < 0 ? 0 : processingTime;
    const safeFileSize = isNaN(req.file.size) ? 0 : req.file.size;
    const safeDuration = isNaN(billableMinutes) ? 0 : billableMinutes;
    const safeCost = isNaN(costINR) ? 0 : costINR;
    
    const doc = await Transcription.create({
      userId: req.user?._id,
      user: req.user?._id, // Keep for backward compatibility
      filename: req.file.originalname,
      transcription: text,
      text: text, // Alternative field name
      duration: safeDuration, // store minutes
      cost: safeCost,
      language: language || 'auto',
      fileSize: safeFileSize,
      processingTime: safeProcessingTime,
    });

    // 5) Cleanup temp file
    fs.promises.unlink(uploadedPath).catch(() => {});

    // 6) Respond in frontend-friendly shape
    return res.status(201).json({
      transcription: {
        _id: doc._id,
        transcription: doc.transcription,
        duration: doc.duration,
        cost: doc.cost,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error("Transcription error:", err);
    return res.status(500).json({
      error: "Transcription failed",
      detail: String(err?.message || err),
    });
  }
};

export const myTranscriptions = async (req, res) => {
  const docs = await Transcription.find({ 
    $or: [{ user: req.user._id }, { userId: req.user._id }]
  })
    .sort({ createdAt: -1 })
    .select("-__v");
  res.json(docs);
};

export const listHistory = async (req, res) => {
  const docs = await Transcription.find({ 
    $or: [{ user: req.user._id }, { userId: req.user._id }]
  })
    .sort({ createdAt: -1 })
    .select("-__v");
  res.json(docs);
};

export const saveHistory = async (req, res) => {
  const { transcription } = req.body;
  if (!transcription?.trim()) {
    return res.status(400).json({ error: "transcription is required" });
  }
  const doc = await Transcription.create({
    userId: req.user._id,
    user: req.user._id, // Keep for backward compatibility
    transcription,
    text: transcription, // Alternative field name
    duration: 0,
    cost: 0,
  });
  res.status(201).json(doc);
};

export const deleteHistory = async (req, res) => {
  const { id } = req.params;
  const doc = await Transcription.findOneAndDelete({
    _id: id,
    $or: [{ user: req.user._id }, { userId: req.user._id }]
  });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
};
