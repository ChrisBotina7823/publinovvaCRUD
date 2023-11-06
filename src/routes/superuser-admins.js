const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { isLoggedIn } = require('../lib/auth');
const multer = require('multer');
const upload = multer({dest:'uploads'})
const { renameFolder, uploadFile, deleteFile, uploadMultipleFiles, createFolder, getFilesInFolder } = require('../lib/driveUpload');
const { getPayments, registerPayment, deletePayment } = require('../lib/db-payments.js');
const MAX_SIZE = 1e7;
const { formatDecimal, formatDate } = require('../lib/helpers.js');
const { registerAdmin } = require('../lib/passport.js');

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM admins');
        const admins = rows[0]
        let current_date = new Date()
        for(admin of admins) {
            admin.last_pay = formatDate (admin.last_pay, /*30*24*3600*1000*/)
            admin.last_pay // offset 
            admin.pending_payment = admin.last_pay < current_date 
        }
        res.render('superuser/superuser-admins', {admins})
    } catch(err) {
        console.error(err)
    }
});

router.get('/add', isLoggedIn, async(req, res) => {
    try {
        console.log(req.user.type)
        res.render('auth/admin-signup', {superuser: true})
    } catch(err) {
        res.redirect('/')
    }
})

router.post('/add', isLoggedIn, async(req, res) => {
    try {
        const {email, name, password} = req.body
        await registerAdmin(email, name, password)
        res.redirect('/')
    } catch(err) {
        res.redirect('/')
    }
})

module.exports = router;