import User from '../models/User.js';
import Transcription from '../models/Transcription.js';

export const loginSuccess = (req, res) => {
  res.json({ user: req.user || null });
};

export const logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ ok: true });
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      isEmailVerified: false
    });

    // Generate OTP
    const otp = user.generateEmailOTP();
    await user.save();

    // Try to send OTP email (optional if email not configured)
    let emailSent = false;
    try {
      const { sendOTPEmail } = await import('../utils/emailService.js');
      emailSent = await sendOTPEmail(user.email, user.name, otp);
    } catch (error) {
      console.log('Email service not configured, skipping email send:', error.message);
    }
    
    if (!emailSent) {
      console.log('OTP generated but email not sent. OTP:', otp);
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'User created successfully. Please check your email for verification code.'
        : `User created successfully. OTP: ${otp} (Email not configured)`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: false
      },
      ...(process.env.NODE_ENV === 'development' && !emailSent && { otp: otp })
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user account'
    });
  }
};

export const login = (req, res) => {
  // Check if user's email is verified
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in. Check your inbox for the verification code.',
      requiresVerification: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isEmailVerified: false
      }
    });
  }

  res.json({
    success: true,
    message: 'Login successful',
    user: req.user
  });
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user statistics
    const stats = await Transcription.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalTranscriptions: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalDuration: { $sum: '$duration' },
          thisMonthTranscriptions: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get recent transcriptions
    const recentTranscriptions = await Transcription.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('text cost duration createdAt');

    const userStats = stats[0] || {
      totalTranscriptions: 0,
      totalCost: 0,
      totalDuration: 0,
      thisMonthTranscriptions: 0
    };

    res.json({
      user: req.user,
      stats: {
        ...userStats,
        recentTranscriptions
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile data'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: name?.trim(),
        email: email?.toLowerCase().trim()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    const isValidOTP = user.verifyEmailOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Try to send welcome email (optional if email not configured)
    try {
      const { sendWelcomeEmail } = await import('../utils/emailService.js');
      await sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.log('Email service not configured, skipping welcome email:', error.message);
    }

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to SpeechAI!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateEmailOTP();
    await user.save();

    // Try to send OTP email (optional if email not configured)
    let emailSent = false;
    try {
      const { sendOTPEmail } = await import('../utils/emailService.js');
      emailSent = await sendOTPEmail(user.email, user.name, otp);
    } catch (error) {
      console.log('Email service not configured, skipping email send:', error.message);
    }
    
    if (!emailSent) {
      console.log('OTP generated but email not sent. OTP:', otp);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your email.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};
