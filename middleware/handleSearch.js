const { ObjectId } = require('mongodb')
const userController = require('../controllers/userController')


const handleSearch = (req, res, next) => {

    if (req.query.searchProduct) {

        return userController.searchProducts(req, res, next)

    } else if (req.query.categories || req.query.brands || req.query.sortby || req.query.targetGroup) {

        return userController.advancedSearch(req, res, next)

    } 
    
    let userFromGidSessionOrSession;

    if (req.session.userId) {

        userFromGidSessionOrSession = new ObjectId(req.session.userId);

    } else if (req.user) {

        userFromGidSessionOrSession = new ObjectId(req.user.id);
    }

    if (userFromGidSessionOrSession) {

        return res.redirect('/home');
        
    }else{

        return res.redirect('/');

    }
}

module.exports = {

    handleSearch

};
