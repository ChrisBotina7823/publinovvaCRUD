const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { pool } = require('../database');
const helpers = require('./helpers');
const { createFolder } = require('../lib/driveUpload')

passport.use('admin.signin', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM admins WHERE email = ?', [username]);
  if (rows[0].length > 0) {
    const user = rows[0][0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      user.type = 'admin'
      done(null, user, req.flash('success', 'Bienvenido, ' + user.name));
    } else {
      done(null, false, req.flash('message', 'Contraseña incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', `El correo ${username} no está registrado en el sistema`));
  }
}));

passport.use('admin.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {

  const { name } = req.body;

  
  const hashedPassword = await helpers.encryptPassword(password);
  const folderId = await createFolder(name, '1V_V3uSqGJELkVfyJIB10vXrE4gjV8QNO');
  
  const newUser = {
    email,
    password: hashedPassword,
    name,
    folderId,
  };
  
  // Saving in the Database
  const result = await pool.query('INSERT INTO admins SET ? ', newUser);
  const header = result[0]
  newUser.type = 'admin'
  newUser.id = header.insertId
  // console.log(result.insertId)
  return done(null, newUser);
}));

passport.use('customer.signin', new LocalStrategy({
  usernameField: 'document',
  passwordField: 'password',
  passReqToCallback: true
}, async(req, username, password, done) => {


  const rows = await pool.query('SELECT * FROM customers WHERE document = ?', [username]);

  // console.log(rows)

  if (rows[0].length > 0) {
    const user = rows[0][0];
    user.type = 'customer'
    const validPassword = user.password.toString() == password.toString()
    // console.log(user)
    // console.log(validPassword)
    if (validPassword) {
      done(null, user, req.flash('success', 'Bienvenido ' + user.fullname));
    } else {
      done(null, false, req.flash('message', 'Contraseña incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', `El documento ${username} no está registrado en el sistema`));
  }
}))

passport.serializeUser((user, done) => {
  // console.log('SERIALIZANDO', user.id)
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  // console.log('DESERIALIZANDO', id)
  let rows = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
  if(rows[0].length == 0) {
    rows = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
  }
  const user = rows[0][0]
  return done(null, user);
});

