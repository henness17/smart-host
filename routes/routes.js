module.exports = function(app){
	// routes must include passport
	require('./passport.js')(app);
	var pg = require('./pg');
  var bodyParser = require('body-parser'),
      path = require('path');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false}));

	app.get('/', loggedIn, AddCheckSet, function(req, res){
    pg.AddCheckRegistration(req.user.id, ContinueIndex);
    function ContinueIndex(){
      res.render('login', {user: req.user});
    }
  });

  app.post('/join-scene', loggedIn, function(req, res){
    // If the user requests to join the room, send the fbid and scene id to pg.JoinScene
    pg.JoinScene(req.user.id, req.query.id, ContinueJoinScene);
    function ContinueJoinScene(){
      res.redirect('/scene?id=' + req.query.id);;
    }
  });

  app.post('/leave-scene', function(req, res){
    // If the user requests to join the room, send the fbid and scene id to pg.JoinScene
    pg.LeaveScene(req.user.id, ContinueLeaveScene);
    function ContinueLeaveScene(){
      res.redirect('/scenes');;
    }
  });

  app.get('/login', function(req, res){
    res.render('login', {user: req.user});
  });

  app.get('/preferences', loggedIn, function(req, res){
    res.render('preferences', {user: req.user});
  });

  app.get('/profile', loggedIn, function(req, res){
    res.render('profile', {user: req.user});
  });

  app.get('/scene', loggedIn, function(req, res){
    // When the scene loads, use id to grab scene default
    pg.GetSceneDefaults(req.query.id, req.user.id, ContinueScene);
    function ContinueScene(general, music, lighting, isInScene){
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
      // Get the scene type
      var sceneType;
      if(general[0].type == "coffee"){
        sceneType = 0;
      }
      res.render('scene', {req: req, sceneid: req.query.id, sceneType: sceneType, timeOfDay: timeOfDay, general: general, music: music, lighting: lighting, isInScene: isInScene});
    }
  });

	app.get('/scenes', loggedIn, AddCheckSet, function(req, res){
    pg.GetScenes(ContinueScenes);
    function ContinueScenes(queryResults){
      var scenes = queryResults;
      res.render('scenes', {scenes: scenes});
    }
 	});

  app.post('/set-preferences', loggedIn, function(req, res){
    pg.SetPreferences(req.user.id, req.body, ContinueSetPreferences);
    function ContinueSetPreferences(){
      res.redirect('/profile');
    }
  });

  function AddCheckSet(req, res, next){
      pg.AddCheckSet(req.user.id, ContinueAddCheckSet);
      //res.render('scenes', {scenes: scenes});
      function ContinueAddCheckSet(userIsSet){
        if(userIsSet){
          next();
        }else{
          res.redirect('/preferences');
        }
      }
  }

  function loggedIn(req, res, next) {
   	if (req.user) {
       	next();
   	} else {
       	res.redirect('/login');
   	}
	}
};  