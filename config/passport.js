const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const UserPreferences = require('../models/UserPreferences');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      let user = await User.findByGoogleId(profile.id);
      
      if (user) {
        // User exists, return user
        return done(null, user);
      }
      
      // Check if user exists with this email
      user = await User.findByEmail(profile.emails[0].value);
      
      if (user) {
        // User exists but doesn't have Google ID, update it
        const db = require('./database');
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE users SET google_id = ? WHERE id = ?',
            [profile.id, user.id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        // Refresh user data
        user = await User.findById(user.id);
        return done(null, user);
      }
      
      // Create new user
      const username = profile.displayName || profile.emails[0].value.split('@')[0];
      const email = profile.emails[0].value;
      
      // Ensure username is unique
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findByUsername(uniqueUsername)) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }
      
      user = await User.create(uniqueUsername, email, null, 'user', profile.id);
      
      // Create default preferences
      await UserPreferences.create(user.id);
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

