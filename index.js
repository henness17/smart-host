// index.js
var express = require('express');
var app = express();

// Our routes
var routes = require('./routes/routes');
app.use('/', routes);

// Listen to port 5000
app.listen(5000, function () {
	console.log('SmartHost app listening on port 5000...');
});