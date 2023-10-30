const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { getFilesInFolder } = require('../lib/driveUpload')
const CryptoJS = require('crypto-js')
const helpers = require("../lib/helpers")

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

router.get('/admin/edit/:id', isLoggedIn, async (req,res) => {
  try {
      const { id } = req.params;
      const rows = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
      const admin = rows[0][0]
      res.render('auth/admin-edit', {admin});

  } catch(err) {
    console.log(err)
    req.flash('message', `${err}`)
    res.redirect('/superuser/admins')
  }
})

router.post('/admin/edit/:id', async (req, res) => {
  const { id } = req.params;
  let { email, password, name } = req.body;
  try {
      let newAdmin = {
          email,
          name
      };
      if(password != "") {
        newAdmin.password = await helpers.encryptPassword(password)
      }

      await pool.query('UPDATE admins set ? WHERE id = ?', [newAdmin, id]);
      req.flash('success', 'Administrador editado con éxito');
      res.redirect('/superuser/admins');
  } catch(err) {
      console.log(err);
      req.flash('message', `Error al editar usuario`)
      res.redirect('/superuser/admins')
  }
})

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

router.get('/customer/signin/:admin_id', isNotAuthenticated, (req, res) => {
  res.render('auth/customer-signin', {hideNav: true, admin_id: req.params.admin_id});
});

// router.post('/customer/signin/:admin_id', passport.authenticate('customer.signin', {
//   failureRedirect: '/customer/signin/:admin_id',
//   failureFlash: true
// }), function(req, res) {
//   // Encriptar el documento del usuario con AES
//   const cypheredDoc = CryptoJS.AES.encrypt(req.user.document, process.env.CYPHER_KEY);
//   // Codificar el documento encriptado para usarlo como parámetro en la URL
//   const encodedDoc = encodeURIComponent(cypheredDoc);
//   console.log(encodedDoc)

//   // Redirigir a /customer/documents con el documento codificado
//   res.redirect(`/customer/documents/${encodedDoc}`);
// });


router.post('/customer/signin/:admin_id', function(req, res, next) {
  passport.authenticate('customer.signin', function(err, user, info) {
    if (err) { 
      return next(err); 
    }
    if (!user) { 
      return res.redirect('/customer/signin/' + req.params.admin_id); 
    }
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); 
      }
      
      const cypheredDoc = CryptoJS.AES.encrypt(req.user.document, process.env.CYPHER_KEY);
      const encodedDoc = encodeURIComponent(cypheredDoc);
      console.log(encodedDoc)
      return res.redirect(`/customer/documents/${encodedDoc}/${req.params.admin_id}`);
    });
  })(req, res, next);
});


// LOGOUT

router.get('/logout', (req, res) => {
  if(!req.isAuthenticated()) res.redirect('/customer/signin');
  const admin = req.user.fullname == undefined;
  const superuser = admin && req.user.user_id
  let admin_id
  if(!admin) admin_id = req.user.user_id
  console.log(admin);
  req.logout();
  req.session.destroy(function (err) {
    if (err) { return next(err); }
    if(admin) {
      if(superuser) {
        res.redirect('/superuser/signin');
      } else {
        res.redirect('/admin/signin');
      }
    } else {
      res.redirect(`/customer/signin/${admin_id}`);
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

router.get('/customer/documents/:cypheredDoc/:admin_id',  async (req, res) => {
  // console.log(req.session)
  try {
    const { admin_id } = req.params
    const cypheredDoc = decodeURIComponent(req.params.cypheredDoc);
    const doc = CryptoJS.AES.decrypt(cypheredDoc.toString(), process.env.CYPHER_KEY).toString(CryptoJS.enc.Utf8);
    const rows = await pool.query('SELECT * FROM customers WHERE document = ? AND user_id = ?', [doc, admin_id]);
    const customer = rows[0][0]
    customer.files = await getFilesInFolder(customer.folderId);
    const payments = await getPayments(customer.id)
    let is_credit = await pool.query('SELECT is_credit FROM admins WHERE id = ?', [customer.user_id])
    is_credit = is_credit[0][0].is_credit
    // console.log(customer.files)
  
    console.log(is_credit);
    pending_credit = customer.status == "pendiente"
    customer.photoUrl = customer.photoId ? `https://drive.google.com/uc?export=view&id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
    res.render('customers/document-list', {customer, hideNav: true, payments, is_credit, pending_credit, error_color:"#ffb8b6"});
  } catch(err) {
    res.redirect("/logout")
  }
})

router.get('/superuser/signin', isNotAuthenticated, async (req, res) => {
  res.render('auth/superuser-signin')
})

router.post('/superuser/signin', async (req, res, next) => {
  passport.authenticate('superuser.signin', {
    successRedirect: '/superuser/admins/',
    failureRedirect: '/superuser/signin',
    failureFlash: true
  })(req, res, next);
} )

router.get('/superuser/signup', isNotAuthenticated, async (req, res) => {
  res.render('auth/superuser-signup')
})

router.post('/superuser/signup', (req, res, next) => {
  passport.authenticate('superuser.signup', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      req.flash('message', info.message);
      return res.redirect('/superuser/signup');
    }

    req.login(user, function(err) {
      if (err) {
        return next(err);
      }

      return res.redirect('/superuser/admins');
    });
  })(req, res, next);
});

module.exports = router;
