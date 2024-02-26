const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { matchPassword } = require('../helpers/encryption.js');
const { registerSuperuser, registerAdmin, getSuperUserByUserId, getUserByInsertId, getAdminById } = require('../database/users.js');
const { getCustomerByKey } = require('../database/customers.js')
/**
 * SIGNUP STRATEGIES: These register superusers and admins
 */
passport.use('superuser.signup', new LocalStrategy({
  usernameField: 'user_id',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, user_id, password, done) => {
  const newUser = await registerSuperuser({user_id, password})
  return done(null, newUser);
}));
passport.use('admin.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  const { name } = req.body;
  let newUser = await registerAdmin({name, email, password})
  return done(null, newUser);
}));


/**
 * SIGNIN STRATEGIES: Customer login based on the document
 */
const signinUser = async ( user, password, req, done ) => {
  // Check User Existence
  if(!user) return done(null, false, req.flash('message', `El Usuario ingresado no está registrado en el sistema`));
  // Check Password
  let validPassword = await matchPassword(password, user.password)
  if(user.type == 'customer') validPassword = user.password == password
  if(!validPassword) return done(null, false, req.flash('message', 'Contraseña incorrecta'))  
  // Successful SignIn
  console.log(user)
  return done(null, user, req.flash('success', 'Bienvenido, ' + ( user.fullname || user.name || user.user_id) ));
}
passport.use('superuser.signin', new LocalStrategy({
  usernameField: 'user_id',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, user_id, password, done) => {
  await signinUser( await getSuperUserByUserId(user_id), password, req, done )
}));
passport.use('admin.signin', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  await signinUser( await getAdminById(email), password, req, done )
}));
passport.use('customer.signin', new LocalStrategy({
  usernameField: 'document',
  passwordField: 'password',
  passReqToCallback: true
}, async(req, document, password, done) => {
  await signinUser( await getCustomerByKey(document, req.params.admin_id), password, req, done )
}))


/**
 * SERIALIZATION: Creates and deletes sessions
*/
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await getUserByInsertId(id)
  return done(null, user);
});

module.exports = passport