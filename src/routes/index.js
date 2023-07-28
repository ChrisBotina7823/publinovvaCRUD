const express = require('express');
const { isLoggedIn } = require('../lib/auth');
const pool = require('../database');
const router = express.Router();

router.get('/', async (req, res) => {
    const q = await pool.query('SELECT 1+1 AS result')
    console.log(q)
});

module.exports = router;