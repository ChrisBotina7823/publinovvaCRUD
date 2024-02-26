const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const cors = require('cors')
const multer = require('multer');
const dotenv = require('dotenv')


// Server Settings
dotenv.config()
const app = express();

// View Engine and Encoding
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./helpers/handlebars')
}))
app.set('view engine', '.hbs');
app.use(morgan('dev'));
app.use(cors())
app.use(express.urlencoded({extended: true}));
app.use(express.json({strict:false}));
app.use(express.static(path.join(__dirname, 'public')));

// Sessions and Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

// Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.flash('error', err.message);
    res.redirect('back');
  } else {
    next(err);
  }
});


// Flash messages
app.use(flash());
app.use((req, res, next) => {
  app.locals.message = req.flash('message');
  app.locals.success = req.flash('success');
  app.locals.user = req.user;
  next();
});

// Routes
app.use( (req, res, next) => {
  console.log(req.user)
  if(req.user && req.user.length) req.user = req.user[0]
  console.log(req.user)
  next()
} )

app.use(require('./routes/index.routes'));
app.use(require('./routes/auth.routes'));
app.use('/admins', require('./routes/admins.routes'));
app.use('/customers', require('./routes/customers.routes'));
app.use('/payments', require('./routes/payments.routes'))
app.use('/files', require('./routes/files.routes'))

 // Starting
 app.listen(app.get('port'), () => {
  console.log('Server is in port', app.get('port'));
});