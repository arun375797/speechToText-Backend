import session from "express-session";

const isProd = process.env.NODE_ENV === "production";

export default {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // true only on https
    httpOnly: true,
    sameSite: "lax"       // if not working, switch to "none" with https
  }
};
