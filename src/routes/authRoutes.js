import { Router } from "express";
import passport from "passport";
import { 
  loginSuccess, 
  logout, 
  signup, 
  login, 
  getProfile, 
  updateProfile,
  verifyOTP,
  resendOTP
} from "../controllers/authController.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

// Google OAuth routes
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

// Local auth routes
router.post("/signup", signup);
router.post("/login", 
  passport.authenticate("local", { 
    failureMessage: true 
  }), 
  login
);

// Session and logout
router.get("/session", loginSuccess);
router.post("/logout", logout);

// Profile routes
router.get("/profile", authRequired, getProfile);
router.put("/profile", authRequired, updateProfile);

// OTP routes
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

export default router;
