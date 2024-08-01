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


module.exports = {

    generateOtp,
    sendOtpEmail,
   
}