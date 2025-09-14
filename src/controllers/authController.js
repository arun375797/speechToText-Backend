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

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
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
