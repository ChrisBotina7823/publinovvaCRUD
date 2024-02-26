const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.redirect('/');
}

const isNotAuthenticated = (req, res, next) => {
    console.log("user: " + req.user)
    if (req.user && !req.user.length) return next();
    switch(req.user?.type) {
        case 'superuser': 
            return res.redirect('/admins')
        case 'admin':
            return res.redirect('/customers')
        case 'customer':
            return res.redirect('/customers/dashboard')
        default:
            return next()
    }
}

module.exports = {
    isLoggedIn,
    isNotAuthenticated
};