module.exports = {
    isLoggedIn (req, res, next) {
        console.log(req.isAuthenticated())
        if (req.isAuthenticated()) {
            return next();
        }
        console.log('aaa')
        res.redirect('/customer/signin');

    },
    isNotAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            return res.redirect('/customer/documents')
        }
        next();
    }
};