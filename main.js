const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

const app = express();
require('dotenv').config();

//Passport config
require('./config/passport')(passport);

app.use(expressLayouts);
app.set('view engine', 'ejs');

//@Middelware & Static Folder
app.use(express.static(`${__dirname}/public`));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({}));

//Express Session Middleware
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middle ware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//Global Variables
app.use((req, res, next) => {
  res.locals.error_msg = req.flash('error_msg');
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error = req.flash('error');
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

//@Routes
app.use('/', require('./routes/index'));
app.use('/u', require('./routes/user'));

//@App Name
const appname = 'School app';

//@Connect To Database
//Connect to Mongo
mongoose
  .connect(
    process.env.MONGO_URI ||
      'mongodb://warrnAX0O:3PqyVMpGfpTryvuZ@cluster0-shard-00-00.qlg4a.mongodb.net:27017,cluster0-shard-00-01.qlg4a.mongodb.net:27017,cluster0-shard-00-02.qlg4a.mongodb.net:27017/cluster0?ssl=true&replicaSet=atlas-ubxvtu-shard-0&authSource=admin&retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true, retryWrites: false }
  )
  .then(() => console.log(`${appname} Database Connected!`))
  .catch((err) => console.log(err));

app.get('/ip.js', (req, res) => {
  res.sendFile('./src/ip.js', { root: path.join(__dirname, './public') });
});

const PORT = process.env.PORT || 3012;
app.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});
