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
  req.check('email', 'Email is Required').notEmpty();
  req.check('password', 'Password is Required').notEmpty();
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

router.get('/customer/signin', isNotAuthenticated, (req, res) => {
  res.render('auth/customer-signin');
});

router.post('/customer/signin', (req, res, next) => {
  req.check('document', 'Document is Required').notEmpty();
  req.check('password', 'Password is Required').notEmpty();
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
  req.logout();
  res.redirect('/');
});

// router.get('/admin/customers', isLoggedIn, (req, res) => {
//   res.render('admin-customers');
// });

router.get('/customer/documents', isLoggedIn, async (req, res) => {
  const rows = await pool.query('SELECT * FROM customers WHERE document = ?', [req.user.document])
  const customers = rows[0]
  for (const customer of customers) {
    customer.files = await getFilesInFolder(customer.folderId);
}
  res.render('customers/document-list', {customers, hideNav: true});
})

module.exports = router;
