const passport = require("passport");
const users = require("../models/userModel");
const GoogleStrategy = require('passport-google-oauth2').Strategy;
require('dotenv').config();


//authentication using google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },

  async (request, accessToken, refreshToken, profile, cb) => {
    
    console.log('Google OAuth function is working')
    
    try {
      
      let user = await users.findOne({googleId: profile.id });

      console.log(profile.id);
      if (!user) {
        user = new users({
          fname: profile.given_name,
          lname: profile.family_name,
          email: profile.email,
          googleId: profile.id // Save the googleId
        })

        await user.save()

      }

      console.log(user);

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



//user login in middleware

const isUserLogin = async(req,res,next) =>{

  try {

    if(!req.session.userId && (!req.isAuthenticated() || !req.user)){
  
      console.log("Access denied for user. Redirecting to signin.")

      return res.redirect("/signin")

    }
    
   next()

  } catch (error) {
    
    console.log(`error from the user isUserLogin middleware`,error.message);

    return res.status(500).send("Internal Server Error");

  }



}

//user logout in middleware

const isUserLogout = async (req,res,next) =>{

  try {
    
    if(req.session.userId && (req.isAuthenticated() || !req.user)){

      next();

    } else {

      console.log("Access denied for user logout. Redirecting to home.");

      return res.redirect("/");
      
    }
    
  } catch (error) {
    
    console.log(`error from the user isUserLogout middleware`,error.message);

    return res.status(500).send("Internal Server Error");

  }
}
module.exports = {

  passport,
  isUserLogin,
  isUserLogout

}
