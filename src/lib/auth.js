module.exports = {
    isLoggedIn (req, res, next) {
        setTimeout( () => {
            if (req.isAuthenticated()) {
                return next();
            }
            res.redirect('/');
        }, 500 )

    },
    isNotAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            if(req.user.fullname == undefined) {
                return res.redirect('/admin/customers')
            } else {
                return res.redirect('/customer/documents')
            }
        } else {
            next();
        }
    }
};