// app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import multer from "multer";

import "./config/db.js";
import "./config/passport.js"; // must set up strategies & serialize/deserialize

import authRoutes from "./routes/authRoutes.js";
import transcriptionRoutes from "./routes/transcriptionRoutes.js";

// ---- envs you actually use ----
const {
  NODE_ENV,
  MONGO_URI,
  SESSION_SECRET,
  CLIENT_ORIGIN,        // prod frontend (Render)
  CLIENT_ORIGIN_DEV,    // local frontend
} = process.env;

const isProd = NODE_ENV === "production";

const app = express();

// Required for secure cookies behind Render’s proxy
app.set("trust proxy", 1);

// Body parsing
app.use(express.json());

// CORS: allow both local & prod frontends
const allowed = [CLIENT_ORIGIN, CLIENT_ORIGIN_DEV].filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);               // e.g. curl/Postman
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Sessions (Mongo store in prod)
app.use(session({
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: isProd ? MongoStore.create({ mongoUrl: MONGO_URI }) : undefined,
  cookie: {
    secure: isProd,                         // HTTPS only in prod
    sameSite: isProd ? "none" : "lax",      // cross-site cookies in prod
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Multer (for uploads)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/api", transcriptionRoutes(upload)); // <-- only once

export default app;
