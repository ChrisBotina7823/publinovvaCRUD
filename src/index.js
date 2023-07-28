const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
// const MySQLStore = require('express-mysql-session')(session);
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const multer = require('multer');
const dotenv = require('dotenv')

dotenv.config()

const { database } = require('./keys');


const mongoose= require('mongoose');
const uri = "mongodb+srv://publinovva:Publinovva123@publinovvadb.6qrmmho.mongodb.net/?retryWrites=true&w=majority";



// Intializations
const app = express();
require('./lib/passport');




// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./lib/handlebars')
}))
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'faztmysqlnodemysql',
  resave: false,
  saveUninitialized: false,
  store: new FileStore()
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());


// Global variables
app.use((req, res, next) => {
  app.locals.message = req.flash('message');
  app.locals.success = req.flash('success');
  app.locals.user = req.user;
  next();
});

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/admin/customers', require('./routes/admin-customers'));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
      req.flash('error', err.message);
      res.redirect('back');
  } else {
      next(err);
  }
});

// Public
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(uri, {
  useUnifiedTopology: true, // For Mongoose 5 only. Remove for Mongoose 6+
  serverSelectionTimeoutMS: 1000, // Defaults to 30000 (30 seconds)
})

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("connected db")
})


// Starting
app.listen(app.get('port'), () => {
  console.log('Server is in port', app.get('port'));
});
