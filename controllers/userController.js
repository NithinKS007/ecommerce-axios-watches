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
    }
}
//loading the registraion page 
const loadRegister = async (req,res) => {
    try {
        
        return res.status(200).render('user/signup')
        
    } catch (error) {

        console.log(`cannot render signup page`,error.message);
        
    }
}

//verifying user

const generateOtp = async (req,res) => {

    req.session.formData = req.body
    const {email}        = req.session.formData

    try {

        const otp = await utils.generateOtp()

        console.log(otp)

        const otpDocument = new OTP({ email, otp })

        await otpDocument.save() //saving the otp to database 

        await utils.sendOtpEmail(email,otp)

        return res.status(200).redirect('/verify-otp')
        
    } catch (error) {

        console.log(`cannot render otpverification page or generate otp`,error.message);
        
    }
}

//loading the otp verification page 

const otpVPage = async (req,res) =>{

    try {
        
        return res.status(200).render('user/otpVerification')

    } catch (error) {
        
        console.log(`error loading the otp verification page`,error.message);
    }
}
//verifying the otp 

const verifyOtp = async (req,res) => {
   

    try {

        const otp    = req.body.otp
        
        console.log(`otp from verificaton page`,otp);

        const email  = req.session.formData.email

        const userDataSession = req.session.formData

        const otpDataBase = await OTP.findOne({email,otp}).exec()

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

                return res.status(200).redirect("/home")

            }else{

               return  res.send('Something went wrong while registering')

            }
        }
        
    } catch (error) {

        console.log(`otp verification is not working`,error.message);
        
    }

}


//loading the signin page
const loadsignin = async (req,res) =>{

    try {
        
       return res.status(200).render("user/signin")

    } catch (error) {
        
        console.log(`error while loading the login page`,error.message);
    }
}


//verifying the user from the signin page
const verifySignin = async (req,res) => {

    const {email,password} = req.body

    try {

        const userData = await users.findOne({email:email})

        if (!userData) {

            return res.render('user/signin', { message: "No user found" });
        }

        if(userData.isAdmin===1){

            return res.render("user/signin",{message:"admins cannot use this page"})
        }
       
        const passwordMatch = await bcrypt.compare(password,userData.password)
        
        if(!passwordMatch){

            return res.render("user/signin",{message:"email or password is incorrect"})
        }


        res.redirect("/home")

    } catch (error) {

        console.log(error.message);
        
    }

}

//loading mens page
const loadMens = async (req,res) =>{

    try {

        const categoriesArray = await categories.find({})
        const productsArray   = await products.find({targetGroup:"men"}).populate('brand')
        const latestProducts  = await products.find({targetGroup:"men"}).sort({createdAt:-1}).limit(10)
        
        return res.status(200).render("user/mensCollection",{categoriesArray,productsArray,latestProducts})

    } catch (error) {
        
        console.log(`error while loading mens page`,error.message);
    }
}

//loading womens page

const loadWomens = async (req,res) =>{

    try {

        const categoriesArray = await categories.find({})
        const productsArray = await products.find({targetGroup:"women"}).populate('brand')
        const latestProducts = await products.find({targetGroup:"women"}).sort({createdAt:-1}).limit(10)

        

        return res.status(200).render("user/womensCollection",{categoriesArray,productsArray,latestProducts})

    } catch (error) {
        
        console.log(`error while loading mens page`,error.message);
    }
}

//loading kids page

const loadKids = async (req,res) =>{

    try {

        const categoriesArray = await categories.find({})
        const productsArray = await products.find({targetGroup:"kids"}).populate('brand')
        const latestProducts = await products.find({targetGroup:"kids"}).sort({createdAt:-1}).limit(10)

       return res.status(200).render("user/kidsCollection",{categoriesArray,productsArray,latestProducts})

    } catch (error) {
        
        console.log(`error while loading mens page`,error.message);
    }
}

//loading the product details page 

const loadProductDetails = async (req,res) =>{

    try {

        const productId = req.query.id //getting the id from the query and passing it to the product details page
    
        const productDetails = await products.findById({_id:productId}).populate('category').populate('brand')

        const relatedProducts = await products.find({category:productDetails.category,targetGroup:productDetails.targetGroup}).limit(4)

   


        if(!productDetails){

            return res.status(404).send("product not found")
        }

        res.status(200).render("user/productDetails",{productDetails,relatedProducts})
        
    } catch (error) {
        
        console.log(`error while loading the product details page`,error.message);
    }
}
module.exports = {

    loadRegister,
    loadsignin,
    generateOtp,
    verifyOtp,
    otpVPage,
    loadHome,
    loadMens,
    loadWomens,
    loadKids,
    loadProductDetails,
    verifySignin
    
}