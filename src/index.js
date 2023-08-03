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

// Scheduling 

new CronJob('0 16 * * *', async () => {
  // Registering metrics
  console.log("Registering today's metrics")
  await registerMetrics()
  console.log("Metrics registered")
  // Activating campaigns
  console.log("Activating Campaigns")
  await turnAllCampaigns(true)
  console.log("Campaigns Activated")

  // Check each 15 minutes for the daily goal
  checkJob.start()
}, null, true);
  


const checkMetrics = async () => {
  console.log("Started Checking")
  let goalReached = true
  console.log("Obtaining current metrics")
  const campaigns = await getLastLog()
  console.log("Current metrics", campaigns)
  for(let campaign of campaigns) {
    
    if(campaign.id == '23856756951880255') {
      // Traffic comprobation
      if(campaign.active) {
        let newBudget = (campaign.cpc > 120) ? 30000 : ( campaign.cpc < 60 ? 90000 : 50000 )
        if(campaign.daily_budget != newBudget) {
          await updateCampaignBudget(campaign.id, newBudget)
          console.log(`Campaign ${campaign.name} budged set to ${newBudget} since cpc is ${campaign.cpc}`)
        }
      }

      if(campaign.clicks > 500 || campaign.spend > 45000) {
        if(campaign.status) {
          await updateCampaignStatus([campaign.id], false)
          console.log(`Campaign ${campaign.name} desactivated`)
        }
      }
      if(campaign.clicks < 500) {
        goalReached = false
      }
    } else {
      if(campaign.active) {
        let newBudget = (campaign.cpc > 400) ? 20000 : ( campaign.cpc < 250 ? 70000 : 35000 ) 
        if(campaign.daily_budget != newBudget) {
          await updateCampaignBudget(campaign.id, newBudget)
          console.log(`Campaign ${campaign.name} budged set to ${newBudget} since cpc is ${campaign.cpc}`)
        }
      }

      // Messages Comprobation
      if(campaign.clicks > 100 || campaign.spend > 25000) {
        if(campaign.status) {
          await updateCampaignStatus([campaign.id], false)
          console.log(`Campaign ${campaign.name} desactivated`)
        }
      }

      if(campaign.clicks < 100) {
        goalReached = false
      }
    }
  }
  return goalReached  
}


let checkJob = new CronJob('*/15 * * * *', async () => {
  const goalReached = await checkMetrics()
  if (goalReached) {
    // Detener la tarea de comprobación
    console.log("Campaign checking stopped, daily goal reached ")
    checkJob.stop();
  } else {
    console.log("Campaigns are still active")
  }
}, () => {
  console.log('Daily goal finished for all tasks')
}, false);


(async () => {
  console.log("Initial checking") 
   const initialGoalReached = await checkMetrics()
   if(!initialGoalReached) {
     console.log("starting comprobation each 15 minutes")
     checkJob.start()
   } else {
    console.log("Campaigns will not be checked today anymore")
   }
 })()
