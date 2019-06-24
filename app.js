var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//express templating engine
var hbs = require('express-handlebars');
//helmet avoid Cross-site scripting (XSS) attack (security purpose)
var helmet = require('helmet');
var compression = require('compression');
var rfs = require('rotating-file-stream');
var fs = require('fs');
//winston logger
var loggerutil = require('./utilities/logger');
var datalogger = require('./utilities/datalogger');   
var db = require('./dbconfig');

/* append routes file in app*/
var router=require('./router');

var app = express();

// Express Status Monitor for monitoring server status
app.use(require('express-status-monitor')({
  title: 'Server Status',
  path: '/status',
  // websocket: existingSocketIoInstance,
  spans: [{
    interval: 1,
    retention: 60
  }, {
    interval: 5,
    retention: 60
  }, {
    interval: 15,
    retention: 60
  }],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  },
  healthChecks: [{
    protocol: 'http',
    host: 'localhost',
    path: '/',
    port: '3000'
  },{
    protocol: 'http',
    host: 'localhost',
    path: '/harsh',
    port: '3000'
  }]
}));

// compress all responses
app.use(compression());

// view engine setup - Express-Handlebars
app.engine('hbs', hbs({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Linking log folder and ensure directory exists
var logDirectory = path.join(__dirname, 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
fs.appendFile('./log/ServerData.log', '', function (err) {
  if (err) throw err;
});

// Create a rotating write stream
var accessLogStream = rfs('Server.log', {
  interval: '1d', // rotate daily
  path: logDirectory
});

// uncomment to redirect global console object to log file
// datalogger.logfile();

// Helmet helps for securing Express apps by setting various HTTP headers
app.use(helmet());

// Generating date and time for logger
logger.token('datetime', function displayTime() {
  return new Date().toString();
});

// Allowing access headers and requests
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "HEAD, OPTIONS, GET, POST, PUT, PATCH, DELETE, CONNECT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// defining mode of logging
app.use(logger('dev'));
app.use(logger(':remote-addr :remote-user :datetime :req[header] :method :url HTTP/:http-version :status :res[content-length] :res[header] :response-time[digits] :referrer :user-agent', {
    stream: accessLogStream
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/',router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
loggerutil.debug('debug message');
loggerutil.error('error message');
loggerutil.silly('silly message');
loggerutil.verbose('verbose message');
loggerutil.warn('warn message');
loggerutil.info('info message');

db.connect()
    .then(() => console.log('Mongo Database connected...'))
    .catch((e) => {
        console.error(e);
        process.exit(1);
});

module.exports = app;
