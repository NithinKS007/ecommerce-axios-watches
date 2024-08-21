const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendToEmailResetPassword = async (email, token) => {
    try {
        
        const resetURL = `http://localhost:7000/resetPassword?token=${token}`

        console.log(`this is the reset url link`,resetURL);
        

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                  `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                  ` ${resetURL}\n\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        });

        console.log('forgot password email send successfully');

    } catch (error) {

        console.error('error sending the mail for reset password',error.message);

    }
    
};

module.exports = {

    sendToEmailResetPassword

}
