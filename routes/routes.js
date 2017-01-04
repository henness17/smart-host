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

  app.get('/profile', loggedIn, function(req, res){
    res.render('profile', {user: req.user});
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
      // Get the time of day
      var date = new Date();
      var currentHour = date.getHours();
      var timeOfDay;
      if(currentHour < 11){
        timeOfDay = 0;
      }else if(currentHour < 17){
        timeOfDay = 1;
      }else{
        timeOfDay = 2;
      }
      var sceneType;
      if(general[0].type == "coffee"){
        sceneType = 0;
      }
      res.render('scene', {req: req, sceneid: req.query.id, sceneType: sceneType, timeOfDay: timeOfDay, general: general, music: music, lighting: lighting});
    }
  });
  
  app.get('/login', function(req, res){
    res.render('login', {user: req.user});
  });
  
  app.post('/join-scene', function(req, res){
    // If the user requests to join the room, send the fbid and scene id to pg.JoinScene
    pg.JoinScene(req.user.id, req.query.id, ContinueJoinScene);
    function ContinueJoinScene(){
      res.redirect('/');;
    }
  });

  function loggedIn(req, res, next) {
   	if (req.user) {
       	next();
   	} else {
       	res.redirect('/login');
   	}
	}
};  