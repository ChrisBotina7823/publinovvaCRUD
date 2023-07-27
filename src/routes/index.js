const express = require('express');
const { isLoggedIn } = require('../lib/auth')
const router = express.Router();

router.get('/', async (req, res) => {
    if(req.isAuthenticated()) {
        if(req.user.fullname) {
            return res.redirect("/customer/documents")
        } else {
            return res.redirect("admin/customers")
        }
    }
    res.render('index');
});

module.exports = router;