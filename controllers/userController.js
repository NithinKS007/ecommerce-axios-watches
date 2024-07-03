const users = require('../models/userModel')
const bcrypt = require('bcrypt')
const utils = require('../utils/otpUtils')
const OTP = require('../models/otpModel')
const products = require('../models/productModel')
const brands = require('../models/brandModel')
const categories = require('../models/categoryModel')

// //hashing the password
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

        const productsArray =await products.find({}).populate('brand')
       
        return res.status(200).render("user/home",{productsArray:productsArray})

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

        const userData = await users.findOne({email:email,is_blocked:false})

        if (!userData) {

            return res.render('user/signin', { message: "No user found or you can't access" });
        }

        if(userData.isAdmin){

            return res.render("user/signin",{message:"admins cannot use this page"})
        }
       
        const passwordMatch = await bcrypt.compare(password,userData.password)
        
        if(!passwordMatch){

            return res.render("user/signin",{message:"email or password is incorrect"})
        }


        res.redirect("/home")

    } catch (error) {

        console.log(`error in the signin function`,error.message);

        return res.status(500).send("Internal server Error")

        
    }

}

//loading mens page
const loadShowCase = async (req,res) =>{

    const targetGroup = req.query.targetGroup
    try {

        const categoriesArray = await categories.find({})
        const productsArray   = await products.find({targetGroup:targetGroup}).populate('brand')
        const latestProducts  = await products.find({targetGroup:targetGroup}).sort({createdAt:-1}).limit(10)
        
        return res.status(200).render("user/showCase",{categoriesArray,productsArray,latestProducts})

    } catch (error) {
        
        console.log(`error while loading mens page`,error.message);

        return res.status(500).send("Internal server Error")

    }
}

//loading the product details page 

const loadProductDetails = async (req,res) =>{

    try {

        const productId = req.query.id //getting the id from the query and passing it to the product details page
    
        const productDetails = await products.findById({_id:productId}).populate('category').populate('brand')

        const relatedProducts = await products.find({category:productDetails.category,targetGroup:productDetails.targetGroup})

   


        if(!productDetails){

            return res.status(404).send("product not found")
        }

        res.status(200).render("user/productDetails",{productDetails,relatedProducts})
        
    } catch (error) {
        
        console.log(`error while loading the product details page`,error.message);

        return res.status(500).send("Internal server Error")

    }
}
module.exports = {

    loadRegister,
    loadsignin,
    generateOtp,
    resendOtp,
    verifyOtp,
    otpVPage,
    loadHome,
    loadShowCase,
    loadProductDetails,
    verifySignin
    
}