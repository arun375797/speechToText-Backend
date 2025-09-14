// Middleware to clean up corrupted sessions
export function sessionCleanup(req, res, next) {
  // Check if session contains corrupted data
  if (req.session && req.session.passport) {
    const userId = req.session.passport.user;
    
    // If user ID is an object instead of a string, clear the session
    if (typeof userId === 'object' && userId !== null) {
      console.log('Clearing corrupted session with object user ID:', userId);
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying corrupted session:', err);
        }
        // Continue without session
        next();
      });
      return;
    }
    
    // If user ID is not a valid ObjectId string, clear the session
    if (typeof userId === 'string' && !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Clearing corrupted session with invalid user ID:', userId);
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying corrupted session:', err);
        }
        // Continue without session
        next();
      });
      return;
    }
  }
  
  next();
}

export default sessionCleanup;
