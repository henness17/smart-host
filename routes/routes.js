// routes.js
module.exports = (function() { 'use strict'; var routes = require('express').Router();

	routes.get('/', function (req, res) { 
		res.send('Hello SmartHost!');
	});
	
	return routes;
})();