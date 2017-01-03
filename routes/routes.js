module.exports = function(app){
	// routes must include passport
	require('./passport.js')(app);
	var pg = require('./pg');
  var bodyParser = require('body-parser'),
      path = require('path');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false}));

	app.get('/', loggedIn, function(req, res){
    res.render('login', {user: req.user});
  });

	app.get('/preferences', loggedIn, function(req, res){
    res.render('preferences', {user: req.user});
	});

	app.get('/scenes', loggedIn, function(req, res){
    pg.GetScenes(ContinueScenes);
    function ContinueScenes(queryResults){
      var scenes = queryResults;
      res.render('scenes', {scenes: scenes});
    }
 	});

  app.get('/login', function(req, res){
    res.render('login', {user: req.user});
  });

  app.get('/scene', loggedIn, function(req, res){
    // We have request which holds the id of our scene
    // Use the id to make a db call
    // Save the info we need in order to populate the sceen :)
    res.render('scene', {req: req});
  });

  function loggedIn(req, res, next) {
   	if (req.user) {
       	next();
   	} else {
       	res.redirect('/login');
   	}
	}
};  