const userController = require('../controllers/userController');

const handleCartUpdate = (req, res, next) => {

  if (req.body.productId && req.body.quantity) {

    console.log(`quantity updating middleware is working`);

    return userController.updateQuantityFromCart(req, res, next)


  } else if (req.body.selectedProductIds) {

    console.log(`selected items updating middleware is working`);

    return userController.updatedSelectedItems(req, res, next)

  } else {

    console.log(`no cart middleware is working`)

   return res.status(400).json({ error: 'Invalid request body' })

  }
};

module.exports = {

  handleCartUpdate,

};

