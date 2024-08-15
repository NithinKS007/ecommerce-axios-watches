const users = require("../models/userModel");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

module.exports = async (req, res, next) => {

    try {

        let userFromGidSessionOrSession;

        console.log('Session:', req.session);
        console.log('User:', req.user);
        
        if (req.session.userId) {

            userFromGidSessionOrSession = new ObjectId(req.session.userId);

        } else if (req.user) {

            userFromGidSessionOrSession = new ObjectId(req.user.id);

        }

        const user = await users.findById(userFromGidSessionOrSession);

        if (!user) {
            
            console.log('User not found');
            return res.redirect('/signin');
        }

        if (user.isBlocked) {

            req.session.destroy(); 

            return res.redirect('/signin');

        }

        next();

    } catch (error) {
        
        console.log(`Error while checking user status`, error.message);

        res.status(500).send('Internal server error');
    }
}


