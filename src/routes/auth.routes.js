const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js')
const passport = require('../auth/passport.js');
const { isNotAuthenticated } = require('../middlewares/auth-md.js')

// SUPERUSER

router.get('/superuser/signin', isNotAuthenticated, async (req, res) => {
  res.render('auth-view/superuser-signin')
})

router.post('/superuser/signin', async (req, res, next) => {
  passport.authenticate('superuser.signin', {
    successRedirect: '/admins',
    failureRedirect: '/superuser/signin',
    failureFlash: true
  })(req, res, next);
})


router.post('/superuser/signup', (req, res, next) => {
  passport.authenticate('superuser.signup', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('message', info.message);
      return res.redirect('/superuser/signup');
    }
    req.login(user, function (err) {
      if (err) return next(err);
      return res.redirect('/admins');
    });
  })(req, res, next);
});

// ADMINS

router.get('/admin/signup', (req, res) => {
  res.render('auth-view/admin-signup');
});

router.post('/admin/signup', (req, res, next) => {
  passport.authenticate('admin.signup', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('message', info.message);
      return res.redirect('/admin/signup');
    }
    req.login(user, function (err) {
      if (err) return next(err);
      return res.redirect('/customers');
    });
  })(req, res, next);
});

router.get('/admin/signin', isNotAuthenticated, (req, res) => {
  res.render('auth-view/admin-signin');
});

router.post('/admin/signin', (req, res, next) => {
  req.check('email', 'El correo electrónico es obligatorio').notEmpty();
  req.check('password', 'La contraseña es obligatoria').notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash('message', errors[0].msg);
    res.redirect('/signin');
  }
  passport.authenticate('admin.signin', {
    successRedirect: '/customers',
    failureRedirect: '/admin/signin',
    failureFlash: true
  })(req, res, next);
});


// CUSTOMERS

router.get('/customer/signin/:admin_id', isNotAuthenticated, (req, res) => {
  res.render('auth-view/customer-signin', { hideNav: true, admin_id: req.params.admin_id });
});

router.post('/customer/signin/:admin_id', function (req, res, next) {
  passport.authenticate('customer.signin', function (err, user, info) {
    if (err) return next(err);
    if (!user) return res.redirect('/customer/signin/' + req.params.admin_id);
    req.logIn(user, function (err) {
      if (err) return next(err);
      console.log(req.user)
      const cypheredDoc = CryptoJS.AES.encrypt(req.user.document, process.env.CYPHER_KEY);
      const encodedDoc = encodeURIComponent(cypheredDoc);
      return res.redirect(`/customers/dashboard/${encodedDoc}/${req.params.admin_id}`);
    });
  })(req, res, next);
});

// LOGOUT
router.get('/logout', (req, res) => {
  if (!req.isAuthenticated()) res.redirect('/customer/signin');
  const type = req.user.type
  const admin_id = req.user.admin_id
  req.logout();
  req.session.destroy(function (err) {
    if (err) { return next(err); }
    switch(type) {
      case 'customer':
        res.redirect(`/customer/signin/${admin_id}`);
        break
      case 'admin':
        res.redirect('/admin/signin');
        break
      case 'superuser':
        res.redirect('/superuser/signin');
        break
      default:
        res.redirect('/')
        break
    }
  });
});

module.exports = router;
