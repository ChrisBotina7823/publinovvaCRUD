const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config()
const from_email = process.env.EMAIL_ADDRESS
const from_password = process.env.EMAIL_PASSWORD

const sendEmail = async (from_name, dest_email, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: from_email,
            pass: from_password,
        },
    });

    const options = {
        from: `${from_name} ${from_email}`,
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
