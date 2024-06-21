const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer')
const OTP = require('../models/otpModel')


//transporting the otp to the email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'devmern2024@gmail.com',
        pass: 'qdot vmev trni dyaj'
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


const resendOtp = async () =>{

    try {

        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)


        const OldOneExpT = await  OTP.find({createdAt})
        
    } catch (error) {

        console.log(`something happended while resending the otp`,error.message);
        
    }
}

module.exports = {

    generateOtp,
    sendOtpEmail
}