const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config()

const sendEmail = async (from_email, from_password, dest_email, subject, text) => {
    console.log(from_email)
    console.log(from_password)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: from_email,
            pass: from_password,
        },
    });

    const options = {
        from: from_email,
        to: dest_email,
        subject,
        text
    }

    try {
        return await transporter.sendMail(options)
    } catch(err) {
        console.error(err)
        return null
    }
}

module.exports = {
    sendEmail
}
