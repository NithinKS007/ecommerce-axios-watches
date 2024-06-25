const passport = require("passport")

const users = require("../models/userModel");

const GoogleStrategy = require('passport-google-oauth2').Strategy

require('dotenv').config()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL ,
    passReqToCallback :true
  },
  async(request,accessToken, refreshToken, profile, cb) => {

    console.log(`google function is working`,profile)

        try {
          
          const user = await users.findOne({email:profile._json.email})
           
          if(!user){

           const user = new users({
             
              fname:profile.given_name,
              lname:profile.family_name,
              email:profile.email,
              googleId:profile.id
              
            })

            await user.save()
            
           return cb(null,user)

          }


        } catch (error) {

          console.log(`error while receiving the data from the google`,error.message);
         
          
        }
  }
));

passport.serializeUser((user,done)=>{

    done(null,user)

})

passport.deserializeUser((user,done)=>{

   done(null,user)
})

module.exports = passport