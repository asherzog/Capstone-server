var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let cors = require('cors');

var wells = require('./routes/wells');
var all = require('./routes/all');
var pdp = require('./routes/pdp');
var tc = require('./routes/TC');
var waterSystem = require('./routes/waterSystem');
var upload = require('./routes/upload');
var production = require('./routes/production');

var app = express();


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use('/', all);
app.use('/wells', wells);
app.use('/pdp', pdp);
app.use('/tc', tc);
app.use('/waterSystem', waterSystem);
app.use('/upload', upload);
app.use('/production', production);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;
