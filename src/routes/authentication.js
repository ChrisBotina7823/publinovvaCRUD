const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { getFilesInFolder } = require('../lib/driveUpload')
const CryptoJS = require('crypto-js')
const { formatDate, unformatDate } = require("../lib/helpers")

const passport = require('passport');
const { isLoggedIn, isNotAuthenticated } = require('../lib/auth');
const { getPayments } = require('../lib/db-payments');

// SIGNUP
router.get('/admin/signup', (req, res) => {
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
      let date = formatDate(admin.last_pay)
      let year = date.getFullYear();
      let month = (date.getMonth() + 1).toString().padStart(2, '0'); // los meses empiezan desde 0 en JavaScript
      let day = date.getDate().toString().padStart(2, '0');
      admin.last_pay = `${year}-${month}-${day}`; // crea una cadena en el formato "yyyy-mm-dd"

      res.render('auth/admin-edit', {admin});

  } catch(err) {
    console.log(err)
    req.flash('message', `${err}`)
    res.redirect('/superuser/admins')
  }
})

router.get('/admin/payments/:id', isLoggedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const admins = await pool.query('select * from admins where id = ?', [id])
      let admin = admins[0][0]
      console.log(admin)
      const rows = await pool.query('SELECT * FROM admin_payments WHERE admin_id = ?', [id]);
      let payments = rows[0]
      admin.initial_pay = formatDate(admin.initial_pay, /*30*24*3600*1000*/)
      for(let i = 0; i<payments.length; i++) {
        payments[i].oportune_date = formatDate(admin.initial_pay,i*30*24*60*60*1000)
        payments[i].oportune = payments[i].payment_date < payments[i].oportune_date
        payments[i].offset = Math.round( Math.abs( payments[i].oportune_date.getTime() - payments[i].payment_date.getTime() ) / (1000*60*60*24) ) 
        console.log(payments[i].offset)
      }
      res.render('auth/admin-payments', {admin, payments});

  } catch(err) {
    console.log(err)
    req.flash('message', `${err}`)
    res.redirect('/superuser/admins')
  }
})

router.get('/admin/pay/:admin_id/:option', isLoggedIn, async (req, res) => {
  const {admin_id, option} = req.params
  
  try {

    if(option == 1) {
      await pool.query('insert into admin_payments(admin_id) values (?)', [admin_id]);
    } else {
      await pool.query('delete from admin_payments where admin_id = ? order by id desc limit 1', [admin_id]);
    }
    await pool.query('CALL update_last_pay(?)', [admin_id]);

    req.flash('success', 'Pago realizado con éxito');
    res.redirect('/superuser/admins');
} catch(err) {
    console.log(err);
    req.flash('message', `Error al realizar el pago`)
    res.redirect('/superuser/admins')
}
})

router.post('/admin/edit/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  let { email, password, name, last_pay } = req.body;
  try {
      let newAdmin = {
          email,
          name,
          initial_pay : unformatDate(last_pay)
      };
      if(password != "") {
        newAdmin.password = await helpers.encryptPassword(password)
      }

      await pool.query('UPDATE admins set ? WHERE id = ?', [newAdmin, id]);
      console.log(await pool.query('CALL update_last_pay(?)', [id]));
      req.flash('success', 'Administrador editado con éxito');
      res.redirect('/superuser/admins');
  } catch(err) {
      console.log(err);
      req.flash('message', `Error al editar usuario`)
      res.redirect('/superuser/admins')
  }
})


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
    res.render('customers/document-list', {customer, hideNav: true, payments, is_credit, pending_credit, error_color:"#ffb8b6", realized: customer.realization == 'realizado', in_process: customer.realization == 'en proceso'});
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

// HIDE INTENTIONALLY
// router.get('/superuser/signup', isNotAuthenticated, async (req, res) => {
//   res.render('auth/superuser-signup')
// })

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
