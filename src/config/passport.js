import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
  if (!user._id) {
    console.error('User missing _id during serialization:', user);
    return done(new Error('User missing _id'), null);
  }
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Handle case where entire profile object might be stored in session
    if (typeof id === 'object' && id !== null) {
      console.error('Session contains object instead of user ID:', id);
      return done(new Error('Invalid session data - object found instead of user ID'), null);
    }
    
    // Ensure id is a valid ObjectId string
    if (typeof id !== 'string' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid user ID format:', id);
      return done(new Error('Invalid user ID format'), null);
    }
    
    const user = await User.findById(id);
    if (!user) {
      return done(null, false);
    }
    
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ORIGIN}/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with same email
        if (profile.emails?.[0]?.value) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.picture = profile.photos?.[0]?.value;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          picture: profile.photos?.[0]?.value,
          isEmailVerified: true,
          lastLogin: new Date()
        });

        await user.save();
        done(null, user);
      } catch (error) {
        console.error('Google OAuth strategy error:', error);
        done(error, null);
      }
    }
  )
);

// Local Strategy for email/password
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        user.lastLogin = new Date();
        await user.save();
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
