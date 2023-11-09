const express = require('express');
const { isNotAuthenticated } = require('../lib/auth');
const { pool } = require('../database');
const router = express.Router();

router.get('/', isNotAuthenticated, async (req, res) => {
    console.log(req.isAuthenticated())
    const ans = await pool.query("mysqlbinlog 'binlog.000002'");
    console.log(ans)
    res.render("index")
});

module.exports = router;