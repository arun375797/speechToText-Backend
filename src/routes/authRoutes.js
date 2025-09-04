import { Router } from "express";
import passport from "passport";
import { loginSuccess, logout } from "../controllers/authController.js";

const router = Router();

// Kick off Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_ORIGIN}/`, // back to login page if failed
  }),
  (_req, res) => {
    // After successful Google login → send to React dashboard
    res.redirect(`${process.env.CLIENT_ORIGIN}/home`);
  }
);



// Who am I / session info
router.get("/session", loginSuccess);

// Logout
router.post("/logout", logout);

export default router;
