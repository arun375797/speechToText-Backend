import { createServer } from "http";
import express from "express";
import cors from "cors";
import session from 'express-session';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure middlewares before creating server
app.use(cors({
  origin: [
    "https://your-frontend-render-url.onrender.com",
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Create and start server after middleware configuration
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
