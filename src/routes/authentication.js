const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { getFilesInFolder } = require('../lib/driveUpload')

const passport = require('passport');
const { isLoggedIn, isNotAuthenticated } = require('../lib/auth');

// SIGNUP
router.get('/admin/signup', isNotAuthenticated, (req, res) => {
  res.render('auth/admin-signup');
});

router.post('/admin/signup', passport.authenticate('admin.signup', {
  successRedirect: '/admin/customers',
  failureRedirect: '/admin/signup',
  failureFlash: true
}));

// SINGIN
router.get('/admin/signin', isNotAuthenticated, (req, res) => {
  res.render('auth/admin-signin');
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
    successRedirect: '/admin/customers',
    failureRedirect: '/admin/signin',
    failureFlash: true
  })(req, res, next);
});

// CUSTOMERS

router.get('/customer/signin', (req, res) => {
  res.render('auth/customer-signin', {hideNav: true});
});

router.post('/customer/signin', (req, res, next) => {
  req.check('document', 'El documento es obligatorio').notEmpty();
  req.check('password', 'La contraseña es obligatoria').notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash('message', errors[0].msg);
    res.redirect('/customer/signin');
  }
  passport.authenticate('customer.signin', {
    successRedirect: '/customer/documents',
    failureRedirect: '/customer/signin',
    failureFlash: true
  })(req, res, next);
})

// LOGOUT

router.get('/logout', (req, res) => {
  const admin = req.user.fullname == undefined
  console.log(admin);
  req.logout();
  if(admin) {
    res.redirect('/admin/signin');
  } else {
    res.redirect('/customer/signin')
  }
});

// router.get('/admin/customers', isLoggedIn, (req, res) => {
//   res.render('admin-customers');
// });

router.get('/customer/documents', isLoggedIn, async (req, res) => {
  const rows = await pool.query('SELECT * FROM customers WHERE document = ?', [req.user.document])
  const customer = rows[0][0]
  customer.files = await getFilesInFolder(customer.folderId);
  console.log(customer.files)
  
  res.render('customers/document-list', {customer, hideNav: true});
})

module.exports = router;
