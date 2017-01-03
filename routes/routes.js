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

  app.get('/hello', function(req, res){
    res.render('hello', {user: req.user});
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

  app.get('/scene', loggedIn, function(req, res){
    // When the scene loads, use id to grab scene default
    pg.GetSceneDefaults(req.query.id, ContinueScene);
    function ContinueScene(general, music, lighting){
      res.render('scene', {req: req, general: general, music: music, lighting: lighting});
    }
  });
  
  app.get('/login', function(req, res){
    res.render('login', {user: req.user});
  });
  
  function loggedIn(req, res, next) {
   	if (req.user) {
       	next();
   	} else {
       	res.redirect('/login');
   	}
	}
};  