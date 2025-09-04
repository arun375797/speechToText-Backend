// src/app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import multer from "multer";
import fs from "fs";

import "./config/db.js";
import "./config/passport.js"; // strategies + serialize/deserialize

import authRoutes from "./routes/authRoutes.js";
import transcriptionRoutes from "./routes/transcriptionRoutes.js";

// ------------------------------------------------------------------
// Ensure an uploads directory exists on every boot (fresh Render image)
try {
  fs.mkdirSync("uploads", { recursive: true });
} catch { /* no-op */ }

// ---- envs actually used ----
const {
  NODE_ENV,
  MONGO_URI,
  SESSION_SECRET,
  CLIENT_ORIGIN,      // prod frontend (Render)
  CLIENT_ORIGIN_DEV,  // local frontend (optional)
} = process.env;

const isProd = NODE_ENV === "production";

const app = express();

// Required for secure cookies behind Render’s proxy
app.set("trust proxy", 1);

// Body parsing
app.use(express.json());

// ------------------------------------------------------------------
// CORS: allow both prod & local frontends, with credentials
const allowed = [CLIENT_ORIGIN, CLIENT_ORIGIN_DEV].filter(Boolean);

// Easiest robust config: pass the array directly
app.use(cors({
  origin: allowed,
  credentials: true,
}));


// ------------------------------------------------------------------
// Sessions (use Mongo store in production for persistence)
app.use(session({
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: isProd ? MongoStore.create({ mongoUrl: MONGO_URI }) : undefined,
  cookie: {
    secure: isProd,                  // HTTPS-only cookie in prod
    sameSite: isProd ? "none" : "lax", // cross-site cookie in prod
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,     // 1 day
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ------------------------------------------------------------------
// Multer (for uploads) - saving to ./uploads which we ensured exists
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

// ------------------------------------------------------------------
// Healthcheck (useful for Render)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/api", transcriptionRoutes(upload)); // mount once

// Optional: not found handler (JSON)
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Optional: basic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", detail: String(err.message || err) });
});

export default app;
