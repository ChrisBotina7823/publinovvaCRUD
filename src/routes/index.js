const express = require('express');
const { isLoggedIn } = require('../lib/auth');
const { connect } = require('../database');
const router = express.Router();

router.get('/', async (req, res) => {
    const client = await connect();
    console.log(client) 
});

module.exports = router;