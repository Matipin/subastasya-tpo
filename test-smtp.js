const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'subastasya.sistema@gmail.com',
        pass: 'jzzvzyjhscmzngit'
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.log("ERROR SMTP:");
        console.log(error);
    } else {
        console.log("SUCCESS SMTP: Server is ready to take our messages");
    }
});
