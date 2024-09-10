const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const sendEmail = async (email, subject, text) => {
    try {
        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: subject,
            text: text
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending the email:', error.message);
        throw new Error('Failed to send email');
    }
};

module.exports = {

    sendEmail
    
};
