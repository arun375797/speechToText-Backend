import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import multer from "multer";

import path from "path";

import "./config/db.js";                  // init Mongo connection
import sessionConfig from "./config/session.js";
import configurePassport from "./config/passport.js";

import authRoutes from "./routes/authRoutes.js";
import transcriptionRoutes from "./routes/transcriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { requireEnv } from "./utils/env.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => {
    // keep the extension (e.g., .m4a)
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});
requireEnv([
  "MONGO_URI",
  "SESSION_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CLIENT_ORIGIN",
]);

const app = express();
const upload = multer({ storage });

// CORS & JSON
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Session + Passport
app.use(session(sessionConfig));
configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Healthcheck (optional)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes (prefix)
app.use("/auth", authRoutes);
app.use("/api", transcriptionRoutes(upload));


app.use("/api", transcriptionRoutes(upload));

export default app;
