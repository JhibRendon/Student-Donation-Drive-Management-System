/**
 * ============================================
 * PASSPORT.JS CONFIGURATION
 * ============================================
 * 
 * This file configures Passport.js for Google OAuth authentication.
 * It handles:
 * - Google OAuth strategy setup
 * - User lookup and creation
 * - Linking Google accounts to existing manual accounts
 * - User serialization/deserialization
 */

import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import Donor from "../models/Donor.js";

/**
 * Configure Passport with Google OAuth Strategy
 * 
 * @param {Object} passport - Passport instance
 */
export default function (passport) {
  /**
   * Google OAuth Strategy
   * Handles authentication via Google accounts
   */
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      /**
       * Google OAuth Callback
       * Called after user authenticates with Google
       * 
       * @param {String} accessToken - Google access token
       * @param {String} refreshToken - Google refresh token
       * @param {Object} profile - User profile from Google
       * @param {Function} done - Passport callback function
       */
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1️⃣ Check if user exists in User collection (already linked Google account)
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // 2️⃣ If not, check if donor email exists (from manual registration)
          const donor = await Donor.findOne({
            email: profile.emails[0].value,
          });

          // 3️⃣ If donor exists, link Google account to existing donor
          if (donor) {
            const linkedUser = await User.create({
              googleId: profile.id,
              displayName: profile.displayName,
              email: donor.email,
              profilePhoto: profile.photos[0].value,
              role: "donor",
            });
            return done(null, linkedUser);
          }

          // 4️⃣ Otherwise create a new user via Google OAuth
          const newUser = await User.create({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            profilePhoto: profile.photos[0].value,
            role: "donor",
          });

          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  /**
   * Serialize User
   * Stores user ID in session
   */
  passport.serializeUser((user, done) => done(null, user.id));

  /**
   * Deserialize User
   * Retrieves user from database using session ID
   */
  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });
}

