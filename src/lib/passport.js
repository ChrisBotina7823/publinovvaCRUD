const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');
const { createFolder } = require('../lib/driveUpload')

passport.use('admin.signin', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM admins WHERE email = ?', [username]);
  if (rows.length > 0) {
    const user = rows[0];
    user.type = "";
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      user.type = 'admin'
      done(null, user, req.flash('success', 'Welcome ' + user.name));
    } else {
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));
  }
}));

passport.use('admin.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {

  const { name } = req.body;

  // Saving in the Database
  const folderId = await createFolder(name, '1V_V3uSqGJELkVfyJIB10vXrE4gjV8QNO');
  
  const hashedPassword = await helpers.encryptPassword(password);

  const newUser = {
    email,
    password: hashedPassword,
    name,
    folderId,
  };

  const result = await pool.query('INSERT INTO admins SET ? ', newUser);
  newUser.id = result.insertId;
  newUser.type = 'admin'
  return done(null, newUser);
}));

passport.use('customer.signin', new LocalStrategy({
  usernameField: 'document',
  passwordField: 'password',
  passReqToCallback: true
}, async(req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM customers WHERE document = ?', [username]);
  if (rows.length > 0) {
    const user = rows[0];
    console.log(typeof user.password.length, " ", typeof password.length)
    const validPassword = user.password == password
    if (validPassword) {
      user.type = 'customer'
      done(null, user, req.flash('success', 'Welcome ' + user.fullname));
    } else {
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));
  }
}))

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  let rows
  if (user.type === 'admin') {
    rows = await pool.query('SELECT * FROM admins WHERE id = ?', [user.id]);
  } else if (user.type === 'customer') {
    rows = await pool.query('SELECT * FROM customers WHERE id = ?', [user.id]);
  }
  done(null, rows[0]);
});

