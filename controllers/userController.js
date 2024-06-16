const users = require('../models/userModel')
const bcrypt = require('bcrypt')
const utils = require('../utils/otpUtils')
const OTP = require('../models/otpModel')

// //hashing the password
const securePassword = async(password)=>{
    try {
       const passwordHash = await bcrypt.hash(password,10)  

        return passwordHash;

    } catch (error) {

        console.log(`cannot hash the password`,error.message);
        
    }
}

//loading the registraion page 
const loadRegister = async (req,res) => {
    try {
        
        res.render('user/signup')
        
    } catch (error) {

        console.log(`cannot render signup page`,error.message);
        
    }
}

//verifying user

const generateOtp = async (req,res) => {

    req.session.formData = req.body
    const {email}        = req.session.formData

    try {
        console.log("generate otp function working")
        const otp = await utils.generateOtp()

        console.log(otp)

        const otpDocument = new OTP({ email, otp })

        await otpDocument.save() //saving the otp to database 

        await utils.sendOtpEmail(email,otp)

        console.log(`otp sended to email ${email}`);

        return res.status(200).render('user/otpVerification')
        
    } catch (error) {

        console.log(`cannot render otpverification page or generate otp`,error.message);
        
    }
}


//verifying the otp 

const verifyOtp = async (req,res) => {
   

    try {

        console.log(`verify otp function working`);

        const otp    = req.body.otp
        
        console.log(`otp from verificaton page`,otp);

        const email  = req.session.formData.email

        const userDataSession = req.session.formData

        console.log(`email from the form data `,email)

        console.log(`form data from the session`,userDataSession)

        const otpDataBase = await OTP.findOne({email,otp}).exec()

        console.log(`otp data from the otpdatabase`,otpDataBase);

        if(otpDataBase){
                 
                   
            const hashedPassword = await securePassword(userDataSession.password)

            const user = new users({

                fname:userDataSession.fname,
                lname:userDataSession.lname,
                email:userDataSession.email,
                phone:userDataSession.phone,
                password:hashedPassword     
            })
            
            console.log(`user data received from the session`,user);

            const userData = await user.save()

            if(userData){

                return res.status(200).send('successfully registered')

            }else{

               return  res.send('Something went wrong while registering')

            }
        }
        
    } catch (error) {

        console.log(`otp verification is not working`,error.message);
        
    }

}
//registering new user
// const insertUser = async (req,res) => {

//     console.log(req.body)

//     const {fname,lname,email,phone,password,cpassword} = req.body

//     try {

//         if(password!==cpassword){
   
//             return res.status(400).render('user/signup', { error: 'Password does not match' });

//         }
//         const existinguser = await users.findOne ({email:email})

//         if(existinguser){

//             return res.status(400).render('user/signup', { error: 'User already exists' });

//         }

//         const hashedPassword = await securePassword(password,10)
//         const user = new users({
//             fname:fname,
//             lname:lname,
//             email:email,
//             phone:phone,
//             password:hashedPassword
//         })

//         const otp = utils.generateOtp()

//         const otpDocument = new OTP({ email, otp })

//         await otpDocument.save()

//         await utils.sendOtpEmail(email,otp)

//         console.log(`otp sended to email ${email}`);

//         const userData = await user.save()


//     } catch (error) {

//         console.log(error.message);
        
//     }

// }

//loading signinpage
const loadsignin = async (req,res) => {

    try {
        console.log("loginpage loaded");

        res.render('user/signin')
        
    } catch (error) {

        console.log(error.message);
        
    }

}


module.exports = {

    loadRegister,
    // insertUser,
    loadsignin,
    generateOtp,
    verifyOtp
    
}