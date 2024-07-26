const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer')
const OTP = require('../models/otpModel')
const crypto = require('crypto');
require('dotenv').config();


//transporting the otp to the email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

//generating a random otp
const generateOtp = () => {

    return  otpGenerator.generate(6, { upperCase: false, specialChars: false })
    
}

//sending the otp via email
const sendOtpEmail = async (email,otp) =>{

    try {

        await transporter.sendMail({
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP is ${otp} . Please do not share this otp with anyone`
        });

    } catch (error) {

        console.log(`error in sending the otp`,error.message);
        
    }
}





const generateSecurityToken = () => {

    return crypto.randomBytes(32).toString('hex');

}

const sendToken = async (email,token) =>{

    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })



    const mailOptions = {

        from:process.env.EMAIL_USER,
        to:email,
        subject:'Your Security Token',
        text:`Your security token is : ${token}`
    }

    try {

         
        await transporter.sendMail(mailOptions)
        console.log('Security token sent successfully');
        
    } catch (error) {
       
        console.error('Error sending security token:', error);
    }
    
}

module.exports = {

    generateOtp,
    sendOtpEmail,
    generateSecurityToken,
    sendToken
}