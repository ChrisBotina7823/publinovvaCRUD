const express = require('express');
const { isLoggedIn, isNotAuthenticated } = require('../middlewares/auth-md.js');
const { sendEmail } = require('../connections/email-manager.js');
const router = express.Router();

router.get('/', isNotAuthenticated, async (req, res) => {
    await sendEmail("avisosdbmanager@gmail.com", "publinovva@123","criedboca@gmail.com", "Prueba", "hola")
    res.render("index")
});

module.exports = router;