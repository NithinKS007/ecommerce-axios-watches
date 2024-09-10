
module.exports = async (req, res, next) => {

    try {

        const currentUser = req.currentUser    

        if (!currentUser) {
            
            return res.redirect('/signin');
        }

        if (currentUser.isBlocked) {

            req.session.destroy(); 

            return res.redirect('/signin');

        }

        next();

    } catch (error) {
        
        console.log(`Error while checking user status`, error.message);

        res.status(500).send('Internal server error');
    }
}


