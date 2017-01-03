module.exports = function(app){
	// routes must include passport
	require('./passport.js')(app);
	var pg = require('./pg');

	app.get('/', loggedIn, function(req, res){
    pg.GetUsers(req.user.id);
    res.render('index', {user: req.user});
  });

	app.get('/preferences', loggedIn, function(req, res){
    res.render('preferences', {user: req.user});
	});

	app.get('/scenes', loggedIn, function(req, res){
    res.render('scenes', {user: req.user});
 	});

  app.get('/login', function(req, res){
    res.render('login', {user: req.user});
  });

  app.get('/scene', loggedIn, function(req, res){
    res.render('scene', {query: req.query});
  });

  function loggedIn(req, res, next) {
   	if (req.user) {
       	next();
   	} else {
       	res.redirect('/login');
   	}
	}
};