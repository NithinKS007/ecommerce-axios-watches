const passport = require("passport");
const users = require("../models/userModel");
const GoogleStrategy = require('passport-google-oauth2').Strategy;
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },

  async (request, accessToken, refreshToken, profile, cb) => {
    
    console.log('Google OAuth function is working')
    
    try {
      let user = await users.findOne({ email: profile._json.email });

      if (!user) {
        user = new users({
          fname: profile.given_name,
          lname: profile.family_name,
          email: profile.email,
          googleId: profile.id // Save the googleId
        })

        await user.save()

      }

      return cb(null, user)


    } catch (error) {

      console.error('Error while receiving data from Google:', error.message)

      return cb(error, null)

    }

  }

))

passport.serializeUser((user, done) => {

  done(null, user.id)

})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id)

    done(null, user)

  } catch (error) {

    done(error, null)

  }

})

module.exports = passport;
