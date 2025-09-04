import { createServer } from "http";
import express from "express";
import cors from "cors";
import session from 'express-session';
import MongoStore from 'connect-mongo';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render's HTTPS
app.set('trust proxy', 1);

// Configure CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_LOCAL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure session with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // Session TTL in seconds (24 hours)
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Create and start server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
