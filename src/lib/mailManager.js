var nodemailer = require('nodemailer');

const user = 'publinovva@gmail.com', pass = 'Publinovva@123'

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user,
        pass
    }
});

module.exports = {
    sendMail: async (to, subject, text) => {
        var mailOptions = {
            from: user,
            to,
            subject,
            text
        };
        await transporter.sendMail(mailOptions);
    }
}
