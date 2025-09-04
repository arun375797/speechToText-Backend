import { Router } from "express";
import passport from "passport";
import { loginSuccess, logout } from "../controllers/authController.js";

const router = Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_ORIGIN}/`,
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_ORIGIN}/home`);
  }
);

router.get("/session", loginSuccess);
router.post("/logout", logout);

export default router;
