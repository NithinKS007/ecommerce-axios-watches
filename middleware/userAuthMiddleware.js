const passport = require("passport");
const statusCode = require("../utils/statusCodes");
const users = require("../models/userModel");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },

    async (request, accessToken, refreshToken, profile, cb) => {
      try {
        let user = await users.findOne({ googleId: profile.id });
        if (!user) {
          user = new users({
            fname: profile.given_name,
            lname: profile.family_name,
            email: profile.email,
            googleId: profile.id,
          });

          await user.save();
        }

        request.session.user_id = user._id;
        request.session.user = user;
        request.session.userType = "google";
        request.session.successMessage = `Login successful! Welcome back, ${user.fname}`;
        return cb(null, user);
      } catch (error) {
        console.error("Error while receiving data from Google:", error.message);

        return cb(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const isUserLogin = async (req, res, next) => {
  try {
    if (req.session.userId || req.user) {
      return next();
    } else {
      return res.redirect("/signin");
    }
  } catch (error) {
    console.error("Error in isUserLogin middleware:", error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const isUserLogout = async (req, res, next) => {
  try {
    if (req.session.userId || req.user) {
      return res.redirect("/home");
    } else {
      return next();
    }
  } catch (error) {
    console.error("Error in isUserLogout middleware:", error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

module.exports = {
  passport,
  isUserLogin,
  isUserLogout,
};
