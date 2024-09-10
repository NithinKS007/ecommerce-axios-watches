const bcrypt = require('bcrypt')
const otpManager = require('../utils/otpManager')
const crypto = require('crypto')

const users = require('../models/userModel')
const OTP = require('../models/otpModel')

const {sendToEmailResetPassword,secureToken} = require('../utils/handleForgotPassword')
const securePassword = require('../utils/hashPassword')


const loadRegister = async (req,res) => {
    try {
        
        return res.status(200).render('user/signup')
        
    } catch (error) {

        console.log(`cannot render signup page`,error.message);

        return res.status(500).render("user/500")

        
    }
}


const generateOtp = async (req,res) => {

    req.session.formData = req.body
    const {email}        = req.session.formData
   
    const existingUser = await users.findOne({email:email})



    if(existingUser){

        return res.status(200).render("user/signin", { message: "This email already has an account on this website." })

    }
    
    try {

        const otp = await otpManager.generateOtp()

        console.log(`first otp form generate otp `,otp)

        const otpDocument = new OTP({ email, otp })

        await otpDocument.save() 

        await otpManager.sendOtpEmail(email,otp)

        return res.status(200).render('user/otpVerification')
        
    } catch (error) {

        console.log(`cannot render otpverification page or generate otp`,error.message);

        return res.status(500).render("user/500")

        
    }
}

const resendOtp = async (req,res) =>{

    const {email}        = req.session.formData

    if (!email) {

        return res.status(400).json({ success: false, message: "Email is required" });

    }

    try {

        const otp = await otpManager.generateOtp()

        console.log(`resend otp`,otp)

        const otpDocument = new OTP({ email, otp })

        await otpDocument.save() 

        await otpManager.sendOtpEmail(email,otp)

        return res.status(200).json({success:true,message : "OTP send to your email"})
        
    } catch (error) {

        console.log(`error while resending the otp`,error.message)
        
        return res.status(500).json({ success: false, message: "Error Resending OTP. Please try again" })
    }
}

const verifyOtp = async (req,res) => {
   
    try {

        const otp    = req.body.otp
        
        const email   = req.session.formData.email

        const userDataSession = req.session.formData
     
        const otpDataBase = await OTP.findOne({email,otp})
 
        if(otpDataBase){
                 
                   
            const hashedPassword = await securePassword(userDataSession.password)

            const user = new users({

                fname:userDataSession.fname,
                lname:userDataSession.lname,
                email:userDataSession.email,
                phone:userDataSession.phone,
                password:hashedPassword,
                           
                     
            })

           const userData = await user.save()

            if(userData){
               
                return res.status(200).json({success :true, message:"Registration successfull"})

            }else{

                return res.status(500).json({ success: false, message: "Something went wrong while registering" })

            }
        }else{

            return res.status(401).json({success:false,message:"Invalid OTP or Expired"})
        }
        
    } catch (error) {

        console.log(`otp verification is not working`,error.message)
        
        return res.status(500).json({ success: false, message: "Error occured during OTP verification" })
        
    }

}
const loadsignin = async (req,res) =>{

    try {
        
       return res.status(200).render("user/signin")

    } catch (error) {
        
        console.log(`error while loading the login page`,error.message);

        return res.status(500).render("user/500")

    }
}

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
        
        req.session.successMessage = `Login successful! Welcome back, ${userData.fname}`;
        

       return res.status(200).redirect("/home")

    } catch (error) {

        console.log(`error in the signin function`,error.message);

        return res.status(500).render("user/500")

        
    }

}

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

         return res.status(500).render("user/500")

    }

}

const loadForgotPassword = async (req,res) =>{

    try {

        return res.status(200).render("user/forgotPassword")

    } catch (error) {
        
        console.log(`error while resetting the password`,error.message);

        return res.status(500).render("user/500")
        
    }

}

const handleForgotPassword = async (req,res) =>{

    try {

        const {email} = req.body

        const userMail = email

        const userData = await users.findOne({email:userMail})

        if(!userData){

            return res.status(400).json({message:"No user found with that email",success:false})
        }
        if(userData.googleId){

            return res.status(400).json({message:"Try login using google",success:false})
        }

        const token =  crypto.randomBytes(32).toString('hex');
        const hashedToken = await secureToken(token)

        userData.resetPasswordToken = hashedToken
        userData.resetPasswordExpires = Date.now() +  300000 
        await userData.save()

        req.session.forgotPasswordEmail = userMail

        await sendToEmailResetPassword(userMail,token)


        return res.status(200).json({ message: "Password reset email sent", success: true });

    } catch (error) {
        
        console.log(`error while changing the password`,error.message);

        return res.status(500).json({ message: "Internal server error", success: false });
        
    }
} 

const loadResetPassword = async (req,res) =>{

    try {
        const { token } = req.query;

        const hashedToken = await secureToken(token)

        const tokenNotexpired = await users.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });

     
        if (!tokenNotexpired) {

            return res.status(404).render("user/404")

        }
        
        return res.status(200).render("user/resetPassword")

        
    } catch (error) {
        
        console.log(`error while loading the reset password page`,error.message);

        return res.status(500).render("user/500")

    }
}

const ResetPassword = async (req,res) =>{

    try {
        
  
        const { password, confirmPassword,token } = req.body

        if (password !== confirmPassword) {

            return res.status(400).json({ message: "Passwords do not match", success: false });

        }

        const email = req.session.forgotPasswordEmail

        if (!email) {

            return res.status(400).json({ message: "Session has expired. Please request a new password reset.", success: false });

        }

        const hashedToken = await secureToken(token)
        
        const userData = await users.findOne({
            email: email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        })

       if (!userData) {

            return res.status(400).json({ message: "Password reset token is invalid or has expired", success: false });

        }

       const newPasswordHash = await securePassword(password)

       userData.password = newPasswordHash
       userData.resetPasswordToken = undefined
       userData.resetPasswordExpires = undefined

       await userData.save()

       req.session.forgotPasswordEmail = undefined

       return res.status(200).json({message:"Your password has been reset successfully",success:true})

    } catch (error) {
        
        console.log(`error while resetting the password`,error.message);

        return res.status(500).json({message:"Error while resetting the password",success:false})
    }
}






module.exports = {
    securePassword,
    secureToken,
    
    loadRegister,
    generateOtp,
    resendOtp,
    verifyOtp,
    loadsignin,
    verifySignin,
    loadUserLogout,
    loadForgotPassword,
    handleForgotPassword,
    loadResetPassword,
    ResetPassword
}


