module.exports = {
    isLoggedIn (req, res, next) {
        console.log(req.isAuthenticated())
        if (req.isAuthenticated()) {
            return next();
        }
        console.log('aaa')
        res.redirect('/admin/signin');

    },
    isNotAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            if(req.user.fullname) {
                return res.redirect('/customer/documents')
            } else {
                return res.redirect('/admin/customers')
            }
        }
        next();
    }
};