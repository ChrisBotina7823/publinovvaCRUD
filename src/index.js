const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const CronJob = require('cron').CronJob
const { turnAllCampaigns, getCampaigns, updateCampaignStatus, updateCampaignBudget } = require('./lib/facebookAPI')

// const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const multer = require('multer');
const dotenv = require('dotenv')

dotenv.config()

const { database } = require('./keys');

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

const Sequelize = require('sequelize');
const { sendMail } = require('./lib/mailManager');
const { registerMetrics, getLastLog } = require('./lib/sheetsUpload');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
});

const sessionStore = new SequelizeStore({
    db: sequelize
});

app.use(session({
    secret: 'session secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

sessionStore.sync();

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
app.use('/admin/campaigns', require('./routes/admin-campaigns'))

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
  