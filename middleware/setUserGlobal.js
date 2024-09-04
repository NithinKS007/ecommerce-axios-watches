
const users = require("../models/userModel")

const setUserGlobal =async  (req, res, next) => {

    if (req.user) {

        req.currentUser  = req.user;

        console.log(`google user`,req.currentUser);
        

    } else if (req.session && req.session.userId) {

        const user = await users.findById(req.session.userId)

        req.currentUser  = user

        console.log(`normal user`,req.currentUser);
        
    } else {

        req.currentUser  = null;
    }

    next();
};



module.exports = { 

    setUserGlobal 
  
}
