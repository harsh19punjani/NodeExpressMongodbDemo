var express = require('express');
var app = express();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var harsh = require('./routes/harsh');
var arjun = require('./routes/arjun');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/harsh', harsh);
app.use('/arjun', arjun);

module.exports = app;