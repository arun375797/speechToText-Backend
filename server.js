import { createServer } from "http";
import app from "./src/app.js";

const PORT = process.env.PORT || 5000;

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

app.use(cors({
  origin: "https://your-frontend-render-url.onrender.com",
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Important for HTTPS
    sameSite: 'none', // Required for cross-origin
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
