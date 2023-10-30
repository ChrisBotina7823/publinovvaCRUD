const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { isLoggedIn } = require('../lib/auth');
const multer = require('multer');
const upload = multer({dest:'uploads'})
const { renameFolder, uploadFile, deleteFile, uploadMultipleFiles, createFolder, getFilesInFolder } = require('../lib/driveUpload');
const { getPayments, registerPayment, deletePayment } = require('../lib/db-payments.js');
const MAX_SIZE = 1e7;
const { formatDecimal } = require('../lib/helpers.js')

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM admins');
        const admins = rows[0]
        res.render('superuser/superuser-admins', {admins})
    } catch(err) {
        console.error(err)
    }
});

router.get('/add', isLoggedIn, async(req, res) => {
    res.redirect('/admin/signup')
})

module.exports = router;