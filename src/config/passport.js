import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ORIGIN}/auth/google/callback`,
      scope: ['profile', 'email']
    },
    function(accessToken, refreshToken, profile, cb) {
      // Here you would typically find or create a user in your database
      return cb(null, profile);
    }
  )
);

export default passport;
