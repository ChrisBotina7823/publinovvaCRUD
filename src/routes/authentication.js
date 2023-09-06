const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { getFilesInFolder } = require('../lib/driveUpload')
const CryptoJS = require('crypto-js')

const passport = require('passport');
const { isLoggedIn, isNotAuthenticated } = require('../lib/auth');
const { getPayments } = require('../lib/db-payments');

// SIGNUP
router.get('/admin/signup', isNotAuthenticated, (req, res) => {
  res.render('auth/admin-signup');
});

router.post('/admin/signup', (req, res, next) => {
  passport.authenticate('admin.signup', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      req.flash('message', info.message);
      return res.redirect('/admin/signup');
    }

    req.login(user, function(err) {
      if (err) {
        return next(err);
      }

      return res.redirect('/admin/customers');
    });
  })(req, res, next);
});


// router.post('/admin/signup', passport.authenticate('admin.signup', {
//   successRedirect: '/admin/customers',
//   failureRedirect: '/admin/signup',
//   failureFlash: true
// }));


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

router.get('/customer/signin', isNotAuthenticated, (req, res) => {
  res.render('auth/customer-signin', {hideNav: true});
});

router.post('/customer/signin', passport.authenticate('customer.signin', {
  failureRedirect: '/customer/signin',
  failureFlash: true
}), function(req, res) {
  // Encriptar el documento del usuario con AES
  const cypheredDoc = CryptoJS.AES.encrypt(req.user.document, process.env.CYPHER_KEY);
  // Codificar el documento encriptado para usarlo como parámetro en la URL
  const encodedDoc = encodeURIComponent(cypheredDoc);
  console.log(encodedDoc)

  // Redirigir a /customer/documents con el documento codificado
  res.redirect(`/customer/documents/${encodedDoc}`);
});


// LOGOUT

router.get('/logout', (req, res) => {
  if(!req.isAuthenticated()) res.redirect('/customer/signin');
  const admin = req.user.fullname == undefined;
  console.log(admin);
  req.logout();
  req.session.destroy(function (err) {
    if (err) { return next(err); }
    if(admin) {
      res.redirect('/admin/signin');
    } else {
      res.redirect('/customer/signin');
    }
  });
});


// router.get('/logout', (req, res) => {
//   const admin = req.user.fullname == undefined
//   console.log(admin);
//   req.logout();
//   if(admin) {
//     res.redirect('/admin/signin');
//   } else {
//     res.redirect('/customer/signin')
//   }
// });

router.get('/customer/documents/:cypheredDoc',  async (req, res) => {
  // console.log(req.session)
  try {
    const cypheredDoc = decodeURIComponent(req.params.cypheredDoc);
    const doc = CryptoJS.AES.decrypt(cypheredDoc.toString(), process.env.CYPHER_KEY).toString(CryptoJS.enc.Utf8);
    const rows = await pool.query('SELECT * FROM customers WHERE document = ?', [doc])
    const customer = rows[0][0]
    customer.files = await getFilesInFolder(customer.folderId);
    const payments = await getPayments(customer.id)
    let is_credit = await pool.query('SELECT is_credit FROM admins WHERE id = ?', [customer.user_id])
    is_credit = is_credit[0][0].is_credit
    // console.log(customer.files)
  
    console.log(is_credit);
    res.render('customers/document-list', {customer, hideNav: true, payments, is_credit});
  } catch(err) {
    res.redirect("/logout")
  }
})

module.exports = router;
