module.exports = {
    isLoggedIn (req, res, next) {
        console.log(req.isAuthenticated())
        if (req.isAuthenticated()) {
            return next();
        }
        console.log('aaa')
        res.redirect('/');

    },
    isNotAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            if(req.user.fullname) {
                return res.redirect('/customer/documents')
            } else if(req.user.user_id) {
                return res.redirect('/superuser/admins')
            } else {
                return res.redirect('/admin/customers')
            }
        }
        next();
    }
};