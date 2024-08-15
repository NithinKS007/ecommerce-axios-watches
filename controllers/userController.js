const bcrypt = require('bcrypt')
const utils = require('../utils/otpUtils')
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const users = require('../models/userModel')
const OTP = require('../models/otpModel')
const products = require('../models/productModel')
const brands = require('../models/brandModel')
const categories = require('../models/categoryModel')
const cart = require('../models/cartModel')
const userAddress = require('../models/addressModel')
const orders = require('../models/orderModel')
const coupons = require('../models/couponModel')
const wishList = require('../models/wishList')

const transaction = require('../models/onlineTransactionModel')

const returnUserOrder = require('../models/returnOrderModel')

const {createRazorPayOrder, verifyRazorPaySignature} = require('../utils/razorPayUtils')

const wallet = require('../models/walletModel');

require('dotenv').config();

const RAZORPAY_SECRECT_KEY = process.env.RAZORPAY_SECRECT_KEY
const RAZORPAY_ID_KEY  = process.env.RAZORPAY_ID_KEY 

//hashing password
const securePassword = async(password)=>{
    try {
       const passwordHash = await bcrypt.hash(password,10)  

        return passwordHash;

    } catch (error) {

        console.log(`cannot hash the password`,error.message);
        
    }
}

//loading the home page 
const loadHome = async (req,res) => {
    
    try {

        const successMessage = req.session.successMessage;

        req.session.successMessage = null;

        const productsArray =await products.find({}).populate('brand').populate('category').sort({createdAt:-1})
       
        return res.status(200).render("user/home",{productsArray, successMessage})

    } catch (error) {
        
        console.log(`error while loading the home page before logging in`,error.message);

        return res.status(500).send("Internal server Error")

    }
}
//loading the registraion page 
const loadRegister = async (req,res) => {
    try {
        
        return res.status(200).render('user/signup')
        
    } catch (error) {

        console.log(`cannot render signup page`,error.message);

        return res.status(500).send("Internal server Error")

        
    }
}

//verifying user

const generateOtp = async (req,res) => {

    req.session.formData = req.body
    const {email}        = req.session.formData
   

    try {

        const otp = await utils.generateOtp()

        console.log(`first otp form generate otp `,otp)

        const otpDocument = new OTP({ email, otp })

        await otpDocument.save() //saving the otp to database 

        await utils.sendOtpEmail(email,otp)

        return res.status(200).redirect('/verifyOtp')
        
    } catch (error) {

        console.log(`cannot render otpverification page or generate otp`,error.message);

        return res.status(500).send("Internal server Error")

        
    }
}

//loading the otp verification page 
const otpVPage = async (req, res) => {
    try {

        return res.status(200).render('user/otpVerification')

    } catch (error) {

        console.error('Error loading the OTP verification page:', error.message)

        return res.status(500).send('Internal Server Error')
        
    }
}

//resend otp function

const resendOtp = async (req,res) =>{

    const {email}        = req.session.formData

    try {

        const otp = await utils.generateOtp()

        console.log(`resend otp`,otp)

        const otpDocument = new OTP({ email, otp })

        await otpDocument.save() //saving the otp to database 

        await utils.sendOtpEmail(email,otp)

        return res.status(200).json({success:true,message : "OTP send to your email"})
        
    } catch (error) {

        console.log(`error while resending the otp`,error.message)
        
        return res.status(500).json({ success: false, message: "Error sending OTP. Please try again" })
    }
}

//verifying the otp 

const verifyOtp = async (req,res) => {
   
    try {

        const otp    = req.body.otp
        
        const email  = req.session.formData.email

        const userDataSession = req.session.formData

        const otpDataBase = await OTP.findOne({email,otp})

        if(otpDataBase){
                 
                   
            const hashedPassword = await securePassword(userDataSession.password)

            const user = new users({

                fname:userDataSession.fname,
                lname:userDataSession.lname,
                email:userDataSession.email,
                phone:userDataSession.phone,
                password:hashedPassword     
            })
    
           const userData = await user.save()

            if(userData){

                return res.status(200).json({success :true, message:"otp validaton successfull"})

            }else{

                return res.status(500).json({ success: false, message: "Something went wrong while registering" })

            }
        }else{

            return res.status(401).json({success:false,message:"Invalid OTP or Expired"})
        }
        
    } catch (error) {

        console.log(`otp verification is not working`,error.message)
        
        return res.status(500).json({ success: false, message: "Error during OTP verification" })
        
    }

}


//loading the signin page
const loadsignin = async (req,res) =>{

    try {
        
       return res.status(200).render("user/signin")

    } catch (error) {
        
        console.log(`error while loading the login page`,error.message);

        return res.status(500).send("Internal server Error")

    }
}


//verifying the user from the signin page
const verifySignin = async (req,res) => {

    const {email,password} = req.body

    try {

        const userData = await users.findOne({email:email,isBlocked:false})
        
        if (!userData) {

            return res.status(401).render('user/signin', { message: "No user found or you can't access" });
        }

        if(!userData?.password){

            return res.status(401).render('user/signin', { message: "Try another login method" });
        }
        const passwordMatch = await bcrypt.compare(password,userData?.password)
        
        if(!passwordMatch){

            return res.render("user/signin",{message:"email or password is incorrect"})
        }

    
        req.session.userId = userData._id
        
        req.session.successMessage = "Login successful! Welcome back!";
        

       return res.status(200).redirect("/home")

    } catch (error) {

        console.log(`error in the signin function`,error.message);

        return res.status(500).send("Internal server Error")

        
    }

}

//loading mens page
const loadShowCase = async (req,res) =>{

    const targetGroup = req.query.targetGroup
    try {

        const categoriesArray = await categories.find({isBlocked:false})
        const brandArray = await brands.find({isBlocked:false})
        const productsArray   = await products.find({targetGroup:targetGroup}).populate('brand').populate('category').sort({createdAt:-1})
        const latestProducts  = await products.find({targetGroup:targetGroup}).sort({createdAt:-1}).limit(10).populate('brand').populate('category')
        
        return res.status(200).render("user/showCase",{categoriesArray,brandArray,productsArray,latestProducts,targetGroup})

    } catch (error) {
        
        console.log(`error while loading mens page`,error.message);

        return res.status(500).send("Internal server Error")

    }
}

//loading the product details page 

const loadProductDetails = async (req,res) =>{

    try {

        const productId = req.query.id //getting the id from the query and passing it to the product details page

        let userFromGidSessionOrSession 

        let existingCartItem

        if(req.session.userId){

            userFromGidSessionOrSession = req.session.userId

        }else if(req.user){

            //checking for google session id 
            userFromGidSessionOrSession = req.user.id

        }

        if(userFromGidSessionOrSession){

          existingCartItem = await cart.findOne({user:userFromGidSessionOrSession,items:{$elemMatch:{product:productId}}})
        }

        const productDetails = await products.findById({_id:productId}).populate('category').populate('brand')

        const productInWishList = await wishList.findOne({

            userId: userFromGidSessionOrSession,
            
            productIds: { $in: [productId] }

        }).exec();

        const relatedProducts = await products.find({category:productDetails.category,targetGroup:productDetails.targetGroup}).populate('category').populate('brand')

        if(!productDetails){

            return res.status(404).send("product not found")
        }

       return res.status(200).render("user/productDetails",{productDetails,relatedProducts,existingCartItem,productInWishList})
        
    } catch (error) {
        
        console.log(`error while loading the product details page`,error.message);

        return res.status(500).send("Internal server Error")

    }
}


//loading the profile of user
const loadUserProfile = async (req,res) =>{

    let userFromGidSessionOrSession 

    try {

        if(req.session.userId){

            userFromGidSessionOrSession = req.session.userId

        }else if(req.user){

            //checking for google session id 
            userFromGidSessionOrSession = req.user.id

        }
        const userData = await users.findById({_id:userFromGidSessionOrSession })

        if(!userData){

            return res.status(404).send("user profile not found")
        }
        
        return res.status(200).render("user/profile",{userData:userData})
        
    } catch (error) {
        
        console.log(`error while loading user profile`,error.message);
    }

}

const editProfile = async (req,res) =>{

    try {

        const { id,updatedUserDetails } = req.body

        const userId = new ObjectId(id)

        const userData = await users.findOne({ _id: userId})
        
        if (!userData) {

            return res.status(404).json({ message: "User not found", success: false })
        }

        const {firstName,lastName,phone} =updatedUserDetails

        const updatedData = { 
            fname: firstName.trim(), 
            lname: lastName.trim(), 
            phone 
        }
      
        const updatedUserData = await users.findByIdAndUpdate(userId,{$set:updatedData},{new:true})

        return res.status(200).json({ message: "Your profile edited successfully", success: true , updatedData: {fname: updatedData.fname,lname: updatedData.lname,phone: updatedData.phone}})
        
    } catch (error) {

        console.log(`Error while editing the user profile:`, error.message);

        return res.status(400).json({ message: "An error occurred while editing your profile", success: false });
       
    }
}


const editPassword = async (req, res) => {
   
        const {updatedPasswordDetails } = req.body;

        console.log(updatedPasswordDetails);

        let userFromGidSessionOrSession;

        if (req.session.userId) {

            userFromGidSessionOrSession = req.session.userId;

        } else if (req.user) {

            userFromGidSessionOrSession = req.user.id;

        }

        try {

            const userData = await users.findOne({ _id: userFromGidSessionOrSession, isBlocked: false });


            if(!userData){

                console.log(`cannot found user data `);
                return res.status(404).json({ message: "User not found", success: false });
            }

            console.log(`this is the existing password comig from the body`,updatedPasswordDetails.existingPassword);
            console.log(`this is the password fromt he database`,userData.password);



            const passwordMatch = await bcrypt.compare(updatedPasswordDetails.existingPassword,userData.password)

            if(!passwordMatch){

                console.log(`password does not match`);
                return res.status(401).json({ message: "Incorrect Current Password", success: false, incorrectPassword: true });
            }


            const hashedNewPassword = await securePassword(updatedPasswordDetails.newPassword)

            const updatedPassword = await users.updateOne({_id:userFromGidSessionOrSession},{$set:{password:hashedNewPassword}})

            if(updatedPassword&&hashedNewPassword){

                console.log(`password matched successfully`);

                return res.status(200).json({ message: "Your password updated successfully", success: true, incorrectPassword: false });

            }
           

        } catch (error) {

            console.log(`Error while editing the password`, error.message);

        }
   
};


//loggingout for user

const loadUserLogout = async (req,res) =>{

    try {
        
        req.session.destroy(err =>{
            if(err){

                console.log(`failed to destroy session`,err.message);

                return res.status(500).send('failed to logout')
            }

            return res.status(200).redirect("/")

        })


    } catch (error) {
        
        console.log(`error while logging out`,error.message);

        return res.status(500).send("An error occurred while logging out the user.")

    }

}

//loading cart page
const loadCart = async (req,res) =>{

    try {
        
        let userFromGidSessionOrSession 

        if(req.session.userId){

            userFromGidSessionOrSession = req.session.userId

        }else if(req.user){

            //checking for google session id 
            userFromGidSessionOrSession = req.user.id

        }

        if(userFromGidSessionOrSession){

            const cartDetails = await cart.find({user:userFromGidSessionOrSession}).populate("items.product").exec()

            const couponDetails = await coupons.find({couponStatus:true})

            const isAlreadyUsedCoupons = await coupons.find({ userBy: userFromGidSessionOrSession });

            const usedCoupons = isAlreadyUsedCoupons.map(coupon => coupon.couponCode)

            const availableCoupons  = couponDetails.filter(coupon => !usedCoupons.includes(coupon.couponCode))

            const cartDetailsForPriceCalculation = await cart.findOne({user:userFromGidSessionOrSession}).populate("items.product").exec()

            const { finalPrice,subTotal } =  await priceSummary(cartDetailsForPriceCalculation)
            
            const selectedItemsCount = cartDetailsForPriceCalculation?.items.filter(item => item?.isSelected).length;

            return  res.status(200).render("user/cart",{cartDetails,finalPrice,subTotal,selectedItemsCount,  availableCoupons })

        }

        
    } catch (error) {
     
        console.log(`error while loading the cart page`,error.message);
    }

}

//calculating ORDER SUMMARY
const priceSummary = async (cartData, couponCode) => {


    try {

      if (cartData?.items.length > 0) {

        const selectedItems = cartData.items.filter((item) => item?.isSelected);
        
        const subTotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
        let finalPrice = subTotal;

        const totalQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);
  
        let discount = 0;
  
        if (couponCode) {

          console.log(`Coupon code received: ${couponCode}`);
          
          const coupon = await coupons.findOne({ couponCode: couponCode });
  
          if (coupon && coupon.couponStatus) {

            if (finalPrice >= coupon.minAmount) {

              discount = (finalPrice * coupon.couponDiscount) / 100;
  
              if (discount > coupon.maxAmount) {

                discount = coupon.maxAmount;
                
              }
  
              finalPrice -= discount;

            } else{

                return { message: "Minimum amount for coupon is not met", subTotal: parseFloat(subTotal.toFixed(2)), finalPrice: parseFloat(finalPrice.toFixed(2)),totalQuantity,discount: 0 };

            }

          }else {
                    return { message: "Invalid or inactive coupon code",subTotal: parseFloat(subTotal.toFixed(2)),finalPrice: parseFloat(finalPrice.toFixed(2)),totalQuantity,discount: 0};
                }

        }
  
        return { subTotal: parseFloat(subTotal.toFixed(2)),finalPrice: parseFloat(finalPrice.toFixed(2)),totalQuantity,discount: parseFloat(discount.toFixed(2)) };

      }
  
      return {  subTotal: 0,finalPrice: 0, totalQuantity: 0, discount: 0 };
  
    } catch (error) {

      console.log(`Error while calculating the price details: ${error.message}`);
     
    }

    
  };

//product adding to cart from the product details page

const addToCart = async (req,res) =>{

    const {productId} = req.body

    let  userFromGidSessionOrSession

    try {

        if(req.session.userId){

            userFromGidSessionOrSession = new ObjectId(req.session.userId) 

        }else if(req.user){

           
            userFromGidSessionOrSession = new ObjectId(req.user.id) 

        }

        const findExistingCart = await cart.findOne({user:userFromGidSessionOrSession}).exec()
        
        const productSalesPrice = await products.findOne({_id:productId},{salesPrice:1,_id:0})
        const productRegularPrice = await products.findOne({_id:productId},{regularPrice:1,_id:0})

        if(!findExistingCart){

            
            const cartItem = new cart({
    
                user:userFromGidSessionOrSession,
                items:[{
    
                    product:productId,
                    price:productSalesPrice.salesPrice,
                    regularPrice:productRegularPrice.regularPrice
    
                }]
    
            })
            
            const savedCartData = await cartItem.save()
    
            if (!savedCartData) {
    
                return res.status(404).json({
    
                    success: false,
    
                    message: "Cannot save the cart data"
    
                })
    
            }
    
            return res.status(200).json({
    
                success:true,
                message:"new cart created for the user and added the product to items array successfully",
    
            })
     
        }else{

            await cart.updateOne({user:userFromGidSessionOrSession},{$push:{items:{product:productId,price:productSalesPrice.salesPrice,regularPrice:productRegularPrice.regularPrice}}})

            return res.status(200).json({
        
                success:true,
                message:"product added to items array for the existing cart successfully",
    
            })
        }

       
       
    } catch (error) {
        
        console.log(`error while adding product to cart from product details page backend`,error.message);
    }
}

//product removing from the cart
const removeFromCart = async (req, res) => {

    try {

      const { productId,couponCode } = req.body
  
      let userFromGidSessionOrSession
  
      if (req.session.userId) {

        userFromGidSessionOrSession =  new ObjectId(req.session.userId) 

      } else if (req.user) {
       
        userFromGidSessionOrSession = new ObjectId (req.user.id)

      }
    
     
     const deletedProductFromCart =  await cart.updateOne({user: userFromGidSessionOrSession},{$pull:{items:{product: productId}}})

     const productName = await products.findById(productId);

     const cartDetails = await cart.findOne({user:userFromGidSessionOrSession})

     const {finalPrice,subTotal,discount} =  await priceSummary(cartDetails,couponCode)

     const isCartEmpty = await cart.findOne({user:userFromGidSessionOrSession})


     const isEmpty = isCartEmpty.items.length === 0

            if (deletedProductFromCart) {
            return res.status(200).json({
                success: true,
                message: "Item deleted from the cart successfully",
                isEmpty:isEmpty,
                productName:productName,
                subTotal:subTotal,
                finalPrice:finalPrice,
                discount:discount,
                cartDetails
            });
            } else {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while deleting item from the cart"
            });
            }

     
    } catch (error) {

      console.log('Error while removing an item from the cart', error.message)

      return res.status(500).send('Internal Server Error')

    }
  }

  //increasing the quantity of the product inside the cart
  const updateQuantityFromCart = async (req,res) =>{

    try {
        let userFromGidSessionOrSession

        if (req.session.userId) {

          userFromGidSessionOrSession = new ObjectId(req.session.userId)

        } else if (req.user) {

          userFromGidSessionOrSession = new ObjectId(req.user.id)

        }
    
        const { productId, quantity,couponCode } = req.body
    
       console.log(`data form the quantity`,productId, quantity,couponCode);

        const productItem = await products.find({_id:productId})
      
        const inventary = await products.findOne({_id:productId},{stock:1,_id:0})


        let productStock 
        productStock = inventary.stock
       

        if(Number(quantity)>productStock){

            return res.status(200).json({ message: `Only ${productStock} is available`,quantity:false});
        }

        if (!productItem) {

          return res.status(404).json({ error: 'Cart not found for the user' });

        }
        if (quantity < 1 || quantity > 5) {

            return res.status(400).json({ message: `Quantity must be between 1 and ${quantity}` });

          }
        const updatedItem = await cart.findOneAndUpdate({user:userFromGidSessionOrSession,"items.product":productId},{$set:{"items.$.quantity":quantity}},{new:true})


        const { finalPrice,subTotal,discount } =  await priceSummary(updatedItem,couponCode)

        return res.status(200).json({ success: true, updatedItem,finalPrice:finalPrice,subTotal:subTotal,discount:discount})

      } catch (error) {

        res.status(500).json({ error: 'Error updating quantity' })

      }

  }

 const updatedSelectedItems = async (req,res) =>{

    try {

        let userFromGidSessionOrSession

        if (req.session.userId) {

          userFromGidSessionOrSession = new ObjectId(req.session.userId)

        } else if (req.user) {

          userFromGidSessionOrSession = new ObjectId(req.user.id)

        }

    
        const { selectedProductIds,couponCode } = req.body;

        console.log(`data form the selection`,selectedProductIds,couponCode);

        const cartDetails = await cart.findOne({user:userFromGidSessionOrSession})

        if(!cartDetails){

            return res.status(400).json({ success: false})

        }

        cartDetails.items = cartDetails.items.map((item)=>{

            if(selectedProductIds.includes(item.product.toString())){

                item.isSelected = true

            }else{

                item.isSelected = false
            }

            return item;
        })

        await cartDetails.save()

        const { finalPrice,subTotal,discount } =  await priceSummary(cartDetails,couponCode)

        return  res.status(200).json({ message: 'Cart updated successfully',finalPrice:finalPrice,cartDetails:cartDetails,subTotal:subTotal,discount:discount});
        

    } catch (error) {
        
        console.log(`error while updating the selection `,error.message);
    }
 }

const loadAddress = async (req,res) =>{

    let userFromGidSessionOrSession

    if (req.session.userId) {

      userFromGidSessionOrSession =  new ObjectId(req.session.userId) 

    } else if (req.user) {
     
      userFromGidSessionOrSession = new ObjectId (req.user.id)

    }

    const addressDetails = await userAddress.find({userId:userFromGidSessionOrSession}).sort({createdAt:-1})


    try {
        
         return res.status(200).render("user/address",{addressDetails})
         
    } catch (error) {
        
        console.log(`error while loading the address page`,error.message);
    }
}

const loadAddAddress = async (req,res) =>{


    try {

        return res.status(200).render("user/addAddress")
        
    } catch (error) {
        
        console.log(`error while loading the address adding page`,error.message);
    }
}
const addAddress = async (req,res) =>{

    const { name, phone, pincode, locality, address, cityDistTown, state, landMark, altPhone, email, addressType } = req.body
      
    let userFromGidSessionOrSession

    if (req.session.userId) {

      userFromGidSessionOrSession =  new ObjectId(req.session.userId) 

    } else if (req.user) {
     
      userFromGidSessionOrSession = new ObjectId (req.user.id)

    }
    try {
        
        const newAddress = await new userAddress({

            name :name,
            userId:userFromGidSessionOrSession,
            phone:phone,
            pincode:pincode,
            locality:locality,
            address:address,
            cityDistTown:cityDistTown,
            state:state,
            landMark:landMark,
            altPhone:altPhone,
            email:email,
            addressType:addressType
        })

        const addressData = await newAddress.save()

        const pushAddressIntoUser = await users.findByIdAndUpdate({_id:userFromGidSessionOrSession},{$push:{addressId:addressData._id}},{ new: true } )

        if(addressData&&pushAddressIntoUser){

            const sourcePage = req.body.sourcePage
            if(sourcePage==="checkout"){

                console.log(`if case is working`);
                return res.redirect("/checkout")

            }else{

                console.log(`else case is working`);

                return res.redirect('/address');
            }
            
        }

    } catch (error) {
        
        console.log(`error while adding the address`,error.message);

    }
}

const editAddress = async (req,res) =>{

    const {id} = req.body
    const {updatedAddress} = req.body

    console.log(`data coming from the front end`,id,updatedAddress);
    if(!updatedAddress||!id){

        console.log(`nothing received from the front end`);

        return res.status(400).json({success:false,message:"Address details are required"})

    }
    try {

        const address = await userAddress.findById({_id:id})
       
        if(!address){

            console.log(`address id cannot found in database`);

            return res.status(404).json({success:false,message:"address not found"})
        }

        const updatedUserAddress = await userAddress.findByIdAndUpdate(id,{$set:updatedAddress},{new:true})

        console.log(`this is the updated user addresss after....`,updatedUserAddress);

        return res.status(200).json({message:"Address edited successfully",success:true, updatedUserAddress:updatedUserAddress})
        
    } catch (error) {
        
        console.log(`error while editing the address`,error.message);
    }
}

const removeAddress = async (req,res) =>{

    try {

        const {addressId} = req.body
        
      let userFromGidSessionOrSession
  
      if (req.session.userId) {

        userFromGidSessionOrSession =  new ObjectId(req.session.userId) 

      } else if (req.user) {
       
        userFromGidSessionOrSession = new ObjectId (req.user.id)

      }
        
      const deletedAddressFromCollection = await userAddress.deleteOne({userId:userFromGidSessionOrSession,_id:addressId})

      const isAddressEmpty = await userAddress.countDocuments({ userId: userFromGidSessionOrSession })

    
      if (deletedAddressFromCollection) {
        return res.status(200).json({
            success: true,
            message: "Item deleted from the address collection successfully",
            isAddressEmpty:isAddressEmpty,
            deletedAddressFromCollection:deletedAddressFromCollection
           
        });
        } else {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting item from the address collection"
        });
        }

    } catch (error) {
        
        console.log(`error while deleting the address`,error.message);
    }
}
//loading the checkout page
const  loadCheckout = async (req,res) =>{

    try {

        let userFromGidSessionOrSession

        if (req.session.userId) {

          userFromGidSessionOrSession = new ObjectId(req.session.userId)

        } else if (req.user) {

          userFromGidSessionOrSession = new ObjectId(req.user.id)

        }

        const {couponCode} = req.query

        const cartData = await cart.findOne({user:userFromGidSessionOrSession}).populate("items.product")

      
        
        const selectedItems = cartData.items.filter(item => item.isSelected)

        const address = await userAddress.find({userId:userFromGidSessionOrSession})


        const {finalPrice,subTotal,discount}= await priceSummary(cartData,couponCode)

        return res.status(200).render("user/checkout", { selectedItems,address,finalPrice,subTotal,discount,couponCode})
        
    } catch (error) {
        
        console.log(`error while loading the checkout page`,error.message);
    }
}

//placing order
const placeOrder = async (req,res) =>{

    try {
        
        let userFromGidSessionOrSession

        if (req.session.userId) {

          userFromGidSessionOrSession = new ObjectId(req.session.userId)

        } else if (req.user) {

          userFromGidSessionOrSession = new ObjectId(req.user.id)

        }
        if (!userFromGidSessionOrSession) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        const{paymentMethod,addressId,couponCode } = req.body

          if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }
        const address =  new ObjectId(addressId) 

        console.log(`this is address id from the front end`,address);
        console.log(`this is the payment method from the front end`,paymentMethod)
        console.log(`this is the coupon code from the front end`,couponCode)

        
        const cartData = await cart.findOne({ user: userFromGidSessionOrSession }).populate({path: "items.product",populate: ['brand', 'category']})
        const addressData = await userAddress.findOne({_id:address})
        const walletData = await wallet.findOne({userId:userFromGidSessionOrSession})
        
        const {balance} = walletData

        const walletBalance = balance

        const {finalPrice,totalQuantity,subTotal,discount} = await priceSummary(cartData,couponCode)

        if (finalPrice > 1000 && paymentMethod === "cashOnDelivery") {
            return res.status(400).json({
                success: false,
                message: 'Cash on delivery only available for upto 1000Rs purchase.',
            });
        }

        if(paymentMethod === "wallet" && walletBalance < finalPrice){
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance',
            });

        }

        
        if(discount>0&&couponCode){

            await coupons.findOneAndUpdate({ couponCode }, { $addToSet: { userBy: userFromGidSessionOrSession } })
        }
        const isSelectedItemsOnly =  cartData.items.filter(item => { 

          return item.isSelected

       })
       if (isSelectedItemsOnly.length === 0 || finalPrice === 0) {
        return res.status(400).json({
            success: false,
            message: 'No items selected or final price is zero',
        });
    }
    //    console.log(`this is is selected items only`,isSelectedItemsOnly);
   
       const orderItems = isSelectedItemsOnly.map(item =>({
        product:item.product._id,
        productName:item.product.name,
        brand: item.product.brand._id,
        brandName:item.product.brand.name,
        category:item.product.category._id,
        categoryName:item.product.category.name,
        categoryDescription:item.product.category.description,
        quantity:item.quantity,
        price:item.price,
        regularPrice:item.regularPrice,
        description:item.product.description,
        targetGroup:item.product.targetGroup,
        displayType:item.product.displayType,
        strapColor:item.product.strapColor,
        strapMaterial:item.product.strapMaterial,
        dialShape:item.product.dialShape,
        images: item.product.images.map(image => image.url || image.path),

       }))

        const order = new orders({

            onlinePaymentOrderId:null,
            items:orderItems,
            user:cartData.user,
            shippingAddress:{

                name:addressData.name,
                phone:addressData.phone,
                pincode:addressData.pincode,
                locality:addressData.locality,
                address:addressData.address,
                cityDistTown:addressData.cityDistTown,
                state:addressData.state,
                landMark:addressData.landMark,
                altPhone:addressData.altPhone,
                email:addressData.email,
                addressType:addressData.addressType,
            },

            totalItems:totalQuantity,
            subTotalAmount:subTotal,
            discountAmount:discount,
            totalAmount:finalPrice,
            paymentMethod:paymentMethod,
        })

       let razorPayOrder

       if(paymentMethod === "razorPay"){

         razorPayOrder = await createRazorPayOrder(finalPrice)

        if (!razorPayOrder||!razorPayOrder.id) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create Razorpay order',
            });
        }

        order.onlinePaymentOrderId = razorPayOrder.id

       }

      const orderData = await order.save()

      // creating transactions

      if(paymentMethod === "razorPay"){

        const newTransaction = new transaction ({

            userId:userFromGidSessionOrSession,
            orderId:orderData._id,
            paymentProvider:paymentMethod,
            onlinePaymentOrderId: razorPayOrder ? razorPayOrder.id : null,
            amount:finalPrice,
    
        })
    
        const transactionsData = await newTransaction.save()

      }else{

        const newWalletTransaction = {

            orderId:orderData._id,
            amount:finalPrice,
            type:"debit",
            walletTransactionStatus:"paid"

        }

        await wallet.findOneAndUpdate(
            { userId: userFromGidSessionOrSession },
            {
                $inc: { balance: -finalPrice }, 
                $push: { transactions: newWalletTransaction }
            },
            { new: true }
        )
      }
      

      if (orderData) {

        const productIds = orderData.items.map(item => item.product)

        const quantityPurchased = orderData.items.map(item =>item.quantity)
        
        console.log('Product IDs:', productIds);
        console.log(`this is the quantity`,quantityPurchased);


        const bulkOps = orderData.items.map(item => ({
            updateOne: {
              filter: { _id: item.product },
              update: { $inc: { stock: -item.quantity } }
            }
          }));
          

        const updateStockOfProducts = await products.bulkWrite(bulkOps)

        const removingFromCart = await cart.findOneAndUpdate({user:userFromGidSessionOrSession},{$pull:{items:{product:{$in:productIds}}}})

        //razor pay section start
        if(paymentMethod === "razorPay") {

            return res.status(200).json({

                success:true,
                message:"Razor pay order created",
                RAZORPAY_ID_KEY:RAZORPAY_ID_KEY,
                amount:finalPrice,
                razorPayOrderPaymentId:orderData.onlinePaymentOrderId
            })
        }
        //razor pay section end
        return res.status(200).json({
            success: true,
            message: 'Order placed successfully',
        });
    } else {
        return res.status(500).json({
            success: false,
            message: 'Failed to place order',
        });
    }
       
          
    } catch (error) {
        
        console.log(`error while placing the order`,error.message)
    }

}

const loadPlaceOrder = async (req, res) => {
    try {
        let userFromGidSessionOrSession 

        if(req.session.userId){

            userFromGidSessionOrSession = req.session.userId

        }else if(req.user){

            //checking for google session id 
            userFromGidSessionOrSession = req.user.id

        }

      
        return res.render('user/placeOrder');

    } catch (error) {

        console.log(`Error while loading the place order page:`, error.message);

        return res.status(500).send('An error occurred while loading the place order page.');
    }
};

//loading orders page
const loadOrders = async (req, res) => {

    let userFromGidSessionOrSession;

    let pageNumber = parseInt(req.query.page) || 1;
    
    const perPageData = 5; 

    if (req.session.userId) {

        userFromGidSessionOrSession = req.session.userId;

    } else if (req.user) {

        // Checking for Google session ID
        userFromGidSessionOrSession = req.user.id;

    }

    try {
      
        const totalOrders = await orders.countDocuments({ user: userFromGidSessionOrSession });

        const totalPages = Math.max(1, Math.ceil(totalOrders / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
      
        const skip = (pageNumber - 1) * perPageData;

        const orderData = await orders.find({ user: userFromGidSessionOrSession })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPageData)
            .exec();

        return res.status(200).render("user/orders", {
            orderData: orderData,
            totalPages: totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.log("Error while loading the orders page:", error.message);

        return res.status(500).send("Internal Server Error");

    }
}



const cancelOrderProduct = async (req, res) => {

    let userFromGidSessionOrSession

    if (req.session.userId) {

      userFromGidSessionOrSession = new ObjectId(req.session.userId)

    } else if (req.user) {

      userFromGidSessionOrSession = new ObjectId(req.user.id)

    }
    if (!userFromGidSessionOrSession) {
        return res.status(400).json({
            success: false,
            message: 'User not found'
        });
    }

    const walletData = await wallet.findOne({ userId: userFromGidSessionOrSession });

    if (!walletData) {

        const newWalletData = new wallet({

            userId: userFromGidSessionOrSession
            
        });

        walletData = await newWalletData.save();
    }

    const { itemId, orderId,orderProductStatus } = req.body;

    try {
        console.log(`Canceling product ${itemId} in order ${orderId},${orderProductStatus}`);

       const validStatuses = getEnumValues(orders.schema, 'items.orderProductStatus');

       if (!validStatuses.includes(orderProductStatus)) {

         return res.status(400).json({ error: 'Invalid order product status' });

       }
   

       const orderIdOfTheItem = new ObjectId(itemId)
       const orderIdOfTheCart = new ObjectId(orderId)

       let updatedProductStatus

       if(orderProductStatus==="pending"||orderProductStatus==="shipped"){

         updatedProductStatus = await orders.updateOne({_id:orderIdOfTheCart,"items._id":orderIdOfTheItem},{$set:{"items.$.orderProductStatus":"cancelled"}})


         if(updatedProductStatus.modifiedCount > 0){

            //Finding the data for adding money to the wallet when canceling each individual product

            const orderData = await orders.findById(orderIdOfTheCart)
            const {subTotalAmount,discountAmount,items} = orderData
            const canceledItem = items.find(item => item._id.equals(orderIdOfTheItem));
            
            if (!canceledItem) {

                return res.status(404).json({ error: 'Item not found in the order' });
            }
            
            const itemTotalAmount = canceledItem.price*canceledItem.quantity
            const itemProportion = itemTotalAmount/subTotalAmount
            const itemDiscount = itemProportion*discountAmount
            const priceAfterEverything = itemTotalAmount-itemDiscount.toFixed(3);
            
            
            const walletData = await wallet.findOne({userId:userFromGidSessionOrSession})

            if (!walletData) {

                return res.status(404).json({ error: 'Wallet not found' });
            }
       
            if (orderData.paymentMethod === "razorPay") {
                const newWalletTransaction = {
                    orderId: orderIdOfTheCart, 
                    amount: priceAfterEverything,
                    type: "credit",
                    walletTransactionStatus: "refunded" 
                };
            
                await wallet.findOneAndUpdate(
                    { userId: userFromGidSessionOrSession },
                    { 
                        $inc: { balance: priceAfterEverything },
                        $push: { transactions: newWalletTransaction }
                    },
                    { new: true }
                );
            }
            
            

             // Update stock quantity after canceling
        const orderDataOfTheProduct = await orders.aggregate([
            { $match: { _id: orderIdOfTheCart } },
            { $unwind: "$items" },
            { $match: { "items._id": orderIdOfTheItem } },
            { $project: { _id: 0, quantity: "$items.quantity" ,productId:"$items.product"} }
          ]);

          const anyNotDelivered = orderData.items.some(item => item.orderProductStatus !== 'delivered');
          const allCancelled = orderData.items.every(item => item.orderProductStatus === 'cancelled');

          let  allOrderCancelled

          if(anyNotDelivered&&allCancelled){

             allOrderCancelled = await orders.updateOne({_id:orderIdOfTheCart},{$set:{orderStatus:"cancelled"}})
            
          }


          const {quantity,productId} =   orderDataOfTheProduct[0] || {};
        
          const updateStockQuantityAfterCancel = await products.findByIdAndUpdate(productId,{$inc:{stock:quantity}},{new:true})


              if(updateStockQuantityAfterCancel){

                 return res.status(200).json({message:"product status updated successfully",success:true,updatedProductStatus:updatedProductStatus,returnStatus:false,allOrderCancelled:allOrderCancelled})
  
              }
           

           
        }

       }else if(orderProductStatus==="delivered"){

        return res.status(200).json({message:"Product already delivered , return only",returnStatus:true})

       }
      
    
       return res.status(400).json({ error:"cannot change status",success:false });

    } catch (error) {

        console.log(`Error while canceling the product`, error.message);

       return res.status(500).json({ error: error.message });
    }
};

const cancelOrder = async (req, res) => {

    let userFromGidSessionOrSession 

    if(req.session.userId){

        userFromGidSessionOrSession = new ObjectId(req.session.userId);

    }else if(req.user){

        //checking for google session id 
        userFromGidSessionOrSession =  new ObjectId(req.user.id);

    }
    const walletData = await wallet.findOne({ userId: userFromGidSessionOrSession });

    if (!walletData) {

        const newWalletData = new wallet({

            userId: userFromGidSessionOrSession
            
        });

        walletData = await newWalletData.save();
    }

    
    const { orderId,orderStatus } = req.body;

    try {
        console.log(`Canceling entire order ${orderId},${orderStatus}`);

        const validStatuses = getEnumValues(orders.schema, 'orderStatus');


        if (!validStatuses.includes(orderStatus)) {

            return res.status(400).json({ error: 'Invalid order status' });
  
          }

          const orderIdOfTheOrder = new ObjectId(orderId)
        //   const orderStatusOfOrder = orderStatus

        //   let updatedOrderStatus 
          
          const order = await orders.findOne({_id:orderIdOfTheOrder})
          
          //Calculating the refund amount for the user's wallet by subtracting the discount from the total order value after canceling the entire order

          const walletData = await wallet.findOne({userId:userFromGidSessionOrSession})

          const { totalAmount } = await orders.findOne({_id:orderIdOfTheOrder},{_id:0,totalAmount:1})
         
          const anyNotDelivered = order.items.some(item => item.orderProductStatus !== 'delivered');
          const allCancelled = order.items.every(item => item.orderProductStatus === 'cancelled');

            if (anyNotDelivered||!allCancelled) {
        
            const allOrderCancelled = await orders.updateOne({_id:orderIdOfTheOrder},{$set:{orderStatus:"cancelled"}})
            

            if(order.paymentMethod==="razorPay"){

                const newWalletTransaction = {

                    orderId:orderIdOfTheOrder,
                    amount:totalAmount,
                    type:"credit",
                    walletTransactionStatus:"refunded"

                }

               await wallet.findOneAndUpdate({userId:userFromGidSessionOrSession},{$inc:{balance:totalAmount},$push:{transactions:newWalletTransaction}},{new:true})
               
              }

            for (let item of order.items) {
                if (item.orderProductStatus !== "cancelled") {

                    await orders.updateOne(
                        { _id: orderIdOfTheOrder, "items._id": item._id },
                        { $set: { "items.$.orderProductStatus": "cancelled" } }
                    );

                    await products.findByIdAndUpdate(item.product,{$inc:{stock:item.quantity}},{new:true})


                }
            }
            
           
             return res.status(200).json({message:"order cancelled successfully",orderNotDelivered:true})


            }


            return res.status(200).json({message:"Order status is delivered"})

    } catch (error) {

        console.log(`Error while canceling the order`, error.message);

       return res.status(500).json({ error: error.message });
    }
};


const getEnumValues = (schema, path) => {

    const enumValues = schema.path(path).enumValues;

    return enumValues;

  };

const advancedSearch = async (req, res) => {
    console.log();
    const { categories, brands, sortby, targetGroup } = req.query;

    const categoriesArray = categories ? categories.split(',').map(id => new ObjectId(id)) : [];
    const brandsArray = brands ? brands.split(',').map(id => new ObjectId(id)) : [];
    const sortbyArray = sortby ? sortby.split(',') : [];

    let arrayToAggregate = [];

    const lookUpBrandsData = () =>{
        arrayToAggregate.push({
            $lookup: {
              from: 'brands',
              localField: 'brand',
              foreignField: '_id',
              as: 'brandData'
            }
          });
        
    }
    if (categoriesArray.length > 0) {
        arrayToAggregate.push({ $match: { category: { $in: categoriesArray } } });
        lookUpBrandsData()
      
    }
    if (brandsArray.length > 0) {
        arrayToAggregate.push({ $match: { brand: { $in: brandsArray } } });
        lookUpBrandsData()
        
    }
    if (targetGroup) {
        arrayToAggregate.push({ $match: { targetGroup: targetGroup } });
        lookUpBrandsData()
        
    }

    if (sortbyArray.includes('priceLowHigh')) {
        arrayToAggregate.push({ $sort: { salesPrice: 1 } });
        lookUpBrandsData()
        
    } else if (sortbyArray.includes('priceHighLow')) {
        arrayToAggregate.push({ $sort: { salesPrice: -1 } });
        lookUpBrandsData()
      
    } else if (sortbyArray.includes('newArrivals')) {
        arrayToAggregate.push({ $sort: { createdAt: -1 } });
        lookUpBrandsData()
        
    } else if (sortbyArray.includes('aToZ')) {
        arrayToAggregate.push({ $sort: { name: 1 } });
        lookUpBrandsData()
        
    } else if (sortbyArray.includes('zToA')) {
        arrayToAggregate.push({ $sort: { name: -1 } });
       
        lookUpBrandsData()
    } else if(sortbyArray.includes('OutOfStock')){

        arrayToAggregate.push({$match:{stock:0}})
    }



    arrayToAggregate.push({ $match: { isBlocked: false } });

    
    try {
        let filterResult;
        if (arrayToAggregate.length > 0) {

            filterResult = await products.aggregate(arrayToAggregate)

        } else {

            filterResult = await products.find({ isBlocked: false })

        }

        return res.status(200).json({
            message: "Data received for filtering",
            success: true,
            data: filterResult
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error occurred during search",
            success: false,
            error: error.message
        });
    }
};

const searchProducts = async (req, res) => {

    const { searchProduct } = req.query;

    try {
      
        console.log(`Search query: ${searchProduct}`);

        const arrayToAggregate = [];

        if (searchProduct) {
            arrayToAggregate.push({
                $match: {
                    $or: [
                        { name: { $regex: searchProduct, $options: 'i' } },
                        { description: { $regex: searchProduct, $options: 'i' } },
                        { dialShape: { $regex: searchProduct, $options: 'i' } },
                        { displayType: { $regex: searchProduct, $options: 'i' } },
                        { strapMaterial: { $regex: searchProduct, $options: 'i' } },
                        { strapColor: { $regex: searchProduct, $options: 'i' } },
                        { targetGroup: { $regex: searchProduct, $options: 'i' } }
                    ]
                }
            });

            arrayToAggregate.push({
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandData'
                }
            });
            arrayToAggregate.push({
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            });

            
        }

        // console.log(`Aggregation : ${JSON.stringify(arrayToAggregate)}`);

        const productsArray = await products.aggregate(arrayToAggregate)
        const categoriesArray = await categories.find().exec();
        const brandArray = await brands.find().exec();

        console.log(`Products array:`, productsArray);

        return res.status(200).render("user/showCaseSearch", { productsArray, categoriesArray ,brandArray});

    } catch (error) {
        console.log(`Error while searching the products`,error.message)

        return res.status(500).send('Internal server error');
    }
};

const applyCoupon = async (req, res) => {
    try {
        let userFromGidSessionOrSession;

        if (req.session.userId) {
            userFromGidSessionOrSession = new ObjectId(req.session.userId);
        } else if (req.user) {
            userFromGidSessionOrSession = new ObjectId(req.user.id);
        }

        const { couponCode } = req.body;
        
        console.log(`this is the add coupon function`, couponCode);

        if (couponCode) {

            const cartDetailsForPriceCalculation = await cart.findOne({ user: userFromGidSessionOrSession }).populate("items.product").exec();

            const{ finalPrice,discount,message,subTotal }  = await priceSummary(cartDetailsForPriceCalculation, couponCode);
            
            if (message) {

                return res.status(400).json({ message, success: false, finalPrice, discount ,subTotal});
                
            }
            return res.status(200).json({ message: "coupon successfully added", success: true, finalPrice,discount,subTotal});

        } else {

            return res.status(400).json({ message: "Invalid coupon code", success: false });

        }

    } catch (error) {

        console.log(`error while adding the coupon`, error.message);

        return res.status(500).json({ message: "Internal Server error", success: false });

    }

};

const removeCoupon = async (req, res) => {
    try {
        let userFromGidSessionOrSession;

        if (req.session.userId) {
            userFromGidSessionOrSession = new ObjectId(req.session.userId);
        } else if (req.user) {
            userFromGidSessionOrSession = new ObjectId(req.user.id);
        }

        const cartDetails = await cart.findOne({ user: userFromGidSessionOrSession })

        if (cartDetails) {
            // Recalculate the final price without any coupon
            const { finalPrice, discount,subTotal} = await priceSummary(cartDetails);

            return res.status(200).json({ message: "coupon successfully removed", success: true, finalPrice, discount,subTotal});

        } else {

            return res.status(400).json({ message: "No cart found", success: false });
        }

    } catch (error) {

        console.log(`error while removing the coupon`, error.message);

        return res.status(500).json({ message: "Internal Server error", success: false });

    }
};
//loading user wishlist page
const loadWishList = async (req, res) => {
    try {
        let userFromGidSessionOrSession;

        if (req.session.userId) {
            userFromGidSessionOrSession = new ObjectId(req.session.userId);
        } else if (req.user) {
            userFromGidSessionOrSession = new ObjectId(req.user.id);
        }

        let wishListOfUser = await wishList.findOne({ userId: userFromGidSessionOrSession });

        if (!wishListOfUser) {

            const newWishList = new wishList({

                userId: userFromGidSessionOrSession

            });
            
            await newWishList.save();

            wishListOfUser = newWishList; 
            
        }

        const productIds = wishListOfUser.productIds || []
        const productData = await products.find({ _id: { $in: productIds } });

        return res.status(200).render("user/wishList", { productData });

    } catch (error) {

        console.log(`Error while loading the wishlist:`, error);

        return res.status(500).send("An error occurred while loading the wishlist.");

    }
};


//product adding to wishlist
const addToWishList = async (req, res) => {
    try {
        let userFromGidSessionOrSession;

        if (req.session.userId) {
            userFromGidSessionOrSession = new ObjectId(req.session.userId);
        } else if (req.user) {
            userFromGidSessionOrSession = new ObjectId(req.user.id);
        }

        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const productObjectId = new ObjectId(productId);

        // Find the wishlist for the user
        const findExistingWishListForUser = await wishList.findOne({ userId: userFromGidSessionOrSession }).exec();

        if (!findExistingWishListForUser) {
            // If the wishlist does not exist, create it
            const wishListProducts = new wishList({
                userId: userFromGidSessionOrSession,
                productIds: [productObjectId] 
            });

            const wishListData = await wishListProducts.save();

            if (!wishListData) {
                return res.status(404).json({
                    success: false,
                    message: "Cannot add product to wishlist, something went wrong"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Product added to the wishlist successfully",
            });
        } else {
            // Check if the product is already in the wishlist
            const productInWishList = await wishList.findOne({
                userId: userFromGidSessionOrSession,
                productIds: { $in: [productObjectId] }
            }).exec();

            if (productInWishList) {
                return res.status(200).json({
                    success: true,
                    message: "Product is already in the wishlist"
                });
            }

            // Push the product ID into the existing wishlist
            await wishList.updateOne(
                { userId: userFromGidSessionOrSession },
                { $push: { productIds: productObjectId } }
            );

            return res.status(200).json({
                success: true,
                message: "Product added to the existing user's wishlist",
            });
        }

    } catch (error) {
        console.log(`Error while adding product to wishlist: ${error.message}`);

        res.status(500).json({ message: 'Internal server error' });
    }
};

const removeFromWishList = async (req,res) =>{

    try {

        let userFromGidSessionOrSession;

        if (req.session.userId) {

            userFromGidSessionOrSession = new ObjectId(req.session.userId);

        } else if (req.user) {

            userFromGidSessionOrSession = new ObjectId(req.user.id);

        }

        const { productId } = req.body;

        if (!productId) {

            return res.status(400).json({ message: 'Product ID is required' });

        }

        const productObjectId = new ObjectId(productId);

        const findExistingWishListForUser = await wishList.findOne({ userId: userFromGidSessionOrSession }).exec();

        if(!findExistingWishListForUser){

            return res.status(400).json({ message: 'This users wish list is not found' });

        }else{

            await wishList.updateOne(

                {userId:userFromGidSessionOrSession},
                {$pull:{productIds:productObjectId}}

            )

            return res.status(200).json({

                success:true,
                message:"Product removed from the existing user's wishlist "
            })

        }
        
    } catch (error) {
        
        console.log(`error while removing the product from the wishlist`,error.message);

        res.status(500).json({ message: 'Internal server error' });

    }
}

const verifyOnlinePayment = async (req,res) =>{

    try {
        
        const {paymentId, orderId, signature} = req.body

        console.log("Request Body:", req.body);

        const isValidPayment = verifyRazorPaySignature(paymentId,orderId,signature)

        if (isValidPayment) {

            await transaction.findOneAndUpdate({onlinePaymentOrderId:orderId},
            {$set:{paymentStatus:"paid"}}
            )
          return  res.json({ success: true ,message:"Online payment verifyed for razorpay" });

        } else {

          return  res.status(400).json({ success: false,message:"Cannot verify online payment for razorpay" });

        }
        
    } catch (error) {
        
        console.log(`error while verifiying the online payment for razorpay`,error.message);
        
    }
}

const loadWallet = async (req, res) => {

    try {
        let userFromGidSessionOrSession;

        if (req.session.userId) {
            userFromGidSessionOrSession = new ObjectId(req.session.userId);
        } else if (req.user) {
            userFromGidSessionOrSession = new ObjectId(req.user.id);
        }

        let walletData = await wallet.findOne({ userId: userFromGidSessionOrSession });

        if (!walletData) {

            const newWalletData = new wallet({

                userId: userFromGidSessionOrSession

            });

            walletData = await newWalletData.save();
        }

        return res.status(200).render("user/wallet", { walletData,transactionsData:walletData.transactions});

    } catch (error) {

        console.log(`Error while loading the wallet page:`, error.message);

        return res.status(500).send("Internal Server Error");
    }
}




const returnProductOrder = async (req,res) =>{

  let userFromGidSessionOrSession 

    if(req.session.userId){

        userFromGidSessionOrSession = new ObjectId(req.session.userId);

    }else if(req.user){

        //checking for google session id 
        userFromGidSessionOrSession =  new ObjectId(req.user.id);

    }
    if (!userFromGidSessionOrSession) {
        return res.status(400).json({
            success: false,
            message: 'User not found'
        });
    }

    try {

        const walletData = await wallet.findOne({ userId: userFromGidSessionOrSession });

        if (!walletData) {

            const newWalletData = new wallet({

                userId: userFromGidSessionOrSession

            });

            walletData = await newWalletData.save();
        }

        const {itemId,productId, orderId, orderProductStatus,reason} = req.body

        console.log(`data received in the return single product order fn backend`,itemId, productId,orderId, orderProductStatus,reason);

        const validStatuses = getEnumValues(orders.schema, 'items.orderProductStatus');

        if (!validStatuses.includes(orderProductStatus)) {

            return res.status(400).json({ error: 'Invalid order product status' });
  
          }

          
       const orderDocIdOfTheItem = new ObjectId(itemId)
       const orderDocIdOfTheOrder = new ObjectId(orderId)
       const productIdOftheItem = new ObjectId(productId)
       
       let updatedProductStatus
       let allDeliveredItemsReturned
       if(orderProductStatus==="delivered"||!orderProductStatus==="cancelled"||!orderProductStatus==="pending"||!orderProductStatus==="shipped"||!orderProductStatus==="returnInitiated"||!orderProductStatus==="returnApproved"||!orderProductStatus==="returnRejected"){


        updatedProductStatus = await orders.updateOne({_id:orderDocIdOfTheOrder,"items._id":orderDocIdOfTheItem},{$set:{"items.$.orderProductStatus":"returnInitiated"}})


       }

       if(updatedProductStatus.modifiedCount > 0){

        console.log(`entering in the if condition`);
        
       
        const orderData = await orders.findOne({ _id: orderDocIdOfTheOrder});

        const {subTotalAmount,discountAmount,items} = orderData

        const returnedItem = items.find(item =>item.product.equals(productId))

            const itemTotalAmount = returnedItem.price*returnedItem.quantity
            const itemProportion = itemTotalAmount/subTotalAmount
            const itemDiscount = itemProportion*discountAmount
            const priceAfterEverything = itemTotalAmount-itemDiscount.toFixed(3);

           // Check if all delivered items are returned
          
            allDeliveredItemsReturned = !orderData.items.some(item =>
            item.orderProductStatus === 'delivered'
        );

        // Update the order status to "returnInitiated" only if all delivered items have been returned
        if (allDeliveredItemsReturned) {
            await orders.updateOne(
                { _id: orderDocIdOfTheOrder },
                { $set: { orderStatus: "returnInitiated" } }
            );
        }
        console.log(`enterind here`)
      

            const returnProductOrderData = new returnUserOrder({

                orderId:orderDocIdOfTheOrder,
                userId:userFromGidSessionOrSession,
                productId:productIdOftheItem,
                productRefundAmount:priceAfterEverything,
                productReturnReason:reason


            })

            console.log(returnProductOrderData,`This is before saving`);
         
           await returnProductOrderData.save()
        
       }

       return res.status(200).json({message:"individual order status updated successfully",success:true,allDeliveredItemsReturned:allDeliveredItemsReturned})
        
    } catch (error) {

        console.log(`error while returning the whole order`,error.message)

        return res.status(500).json({ message: 'Internal Server Error' });
    }
}



module.exports = {

  // user authentication

    loadRegister,
    loadsignin,
    verifySignin,
    loadUserLogout,

  // OTP verification

    generateOtp,
    resendOtp,
    verifyOtp,
    otpVPage,

  // pages 

    loadHome,
    loadShowCase,
    loadProductDetails,
    loadUserProfile,
    loadCart,
    loadAddress,
    loadAddAddress,
    loadCheckout,
    loadPlaceOrder,
    loadOrders,
    loadWishList,
    loadWallet,

  // user profile management

    editProfile,
    editPassword,

  // cart management

    addToCart,
    removeFromCart,
    updateQuantityFromCart,
    updatedSelectedItems,
    applyCoupon,
    removeCoupon,
    


  // Address Management

    addAddress,
    removeAddress,
    editAddress,


  // order management

    placeOrder,
    cancelOrder,
    cancelOrderProduct,
    returnProductOrder,

   
  //searching and filtering

    advancedSearch,
    searchProducts,
   
    //wishlist manage
    addToWishList,
    removeFromWishList,

    //verify online payment route
    verifyOnlinePayment,

  
}