const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const cors = require('cors')
const fileUpload = require('express-fileupload');

// const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const multer = require('multer');
const dotenv = require('dotenv')

dotenv.config()

const { database } = require('./keys');
const { strict } = require('assert');

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
app.use(cors())
app.use(express.urlencoded({extended: true}));
app.use(express.json({strict:false}));
// const MySQLStore = require('express-mysql-session')(session);
// app.use(session({
//   secret: 'faztmysqlnodemysql',
//   resave: false,
//   saveUninitialized: false,
//   store: new MySQLStore({
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     database: process.env.DB_NAME
//   })
// }));


// const SequelizeStore = require('connect-session-sequelize')(session.Store);
// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'mysql',
//     logging: false
// });
// const sessionStore = new SequelizeStore({
//     db: sequelize
// });
// app.use(session({
//     secret: 'session secret',
//     store: sessionStore,
//     resave: false,
//     saveUninitialized: false
// }));
// sessionStore.sync();

app.use(session({
  secret: 'keyboard cat', // Una clave secreta para firmar la cookie
  resave: false, // Si se debe guardar la sesión aunque no haya cambios
  saveUninitialized: true, // Si se debe guardar la sesión aunque esté vacía
}))


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
app.use('/superuser/admins', require('./routes/superuser-admins'));

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

 // Starting
app.listen(app.get('port'), () => {
  console.log('Server is in port', app.get('port'));
});

// // Scheduling 

// new CronJob('0 16 * * *', async () => {
//   // Registering metrics
//   console.log("Registering today's metrics")
//   await registerMetrics()
//   console.log("Metrics registered")
//   // Activating campaigns
//   console.log("Activating Campaigns")
//   await turnAllCampaigns(true)
//   console.log("Campaigns Activated")

//   // Check each 15 minutes for the daily goal
//   checkJob.start()
// }, null, true);
  