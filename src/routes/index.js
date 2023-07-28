const express = require('express');
const { isLoggedIn } = require('../lib/auth');
const { pool } = require('../database');
const router = express.Router();

router.get('/', async (req, res) => {
    res.render("index")
});

module.exports = router;