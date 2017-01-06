module.exports = function(app){
	// routes must include passport
	require('./passport.js')(app);
	var pg = require('./pg');
  var bodyParser = require('body-parser'),
      path = require('path');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false}));

	app.get('/', loggedIn, function(req, res){
    pg.AddCheckRegistration(req.user.id, ContinueIndex);
    function ContinueIndex(){
      res.render('index', {user: req.user});
    }
  });

  app.post('/join-scene', loggedIn, CheckPreferencesSet, function(req, res){
    // If the user requests to join the room, send the fbid and scene id to pg.JoinScene
    pg.JoinScene(req.user.id, req.query.id, ContinueJoinScene);
    function ContinueJoinScene(){
      res.redirect('/scene?id=' + req.query.id);;
    }
  });

  app.post('/leave-scene', loggedIn, function(req, res){
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
    res.render('preferences', {user: req.user, set:true});
  });

  app.get('/profile', loggedIn, function(req, res){
    res.render('profile', {user: req.user});
  });

  app.get('/scene', loggedIn, CheckPreferencesSet, function(req, res){
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
      }else if(general[0].type == "bar"){
        sceneType = 1;
      }
      //var lightingData = [["Hello", "There"],["",10],["Light", 90]];
      //var musicData = [["Hello", "There"],["Rock",40],["Rap", 60]];
      // Construct data from users that are in the scene
      pg.GetSceneData(req.query.id, sceneType, timeOfDay, ManageAndReturnData);
      function ManageAndReturnData(lightingData, musicData){
        // Okay now we've got our shit populate [alternative, rock, etc..], [25, 60, etc..]
        console.log("MARD Starts Lighting: " + lightingData);
        console.log("MARD Starts Music: " + musicData);
        var lightingDataReturn = ManageLightingArray(lightingData);
        var musicDataReturn = ManageMusicArray(musicData, renderScene);
        
        function ManageMusicArray(array, callback) {
            console.log("MANAGE MUSIC ARRAY");
            var order = ["Hello"], count = ["There"], prev, returnArray = [];
            array.sort();
            for ( var i = 0; i < array.length; i++ ) {
                if ( array[i] !== prev ) {
                    order.push(array[i]);
                    count.push(1);
                } else {
                    count[count.length-1]++;
                }
                prev = array[i];
            }
            for(var i = 0; i < order.length; i++){
              returnArray.push([order[i], count[i]])
            }
            callback(returnArray);
            console.log("LEAVING MANAGE MUSIC ARRAY");
        }
        function ManageLightingArray(array){
          console.log("MANAGE LIGHTING ARRAY");
          var avg = 0;
          for(var i = 0; i < array.length; i++){
            avg = avg + array[i];
          }
          avg/=array.length;
          var returnArray = [["Hello", "There"],["",100-avg],["Light",avg]];
          console.log("LEAVING MANAGE LIGHTING ARRAY");
          return returnArray;
        }

        function renderScene(musicDataFromCallback){
          console.log("RENDER SCENE");
          console.log(musicDataFromCallback);
          console.log(lightingDataReturn)
          res.render('scene', {req: req, user: req.user, sceneid: req.query.id, sceneType: sceneType, 
            timeOfDay: timeOfDay, general: general, music: music, lighting: lighting, isInScene: isInScene, lightingData: lightingDataReturn,
            musicData: musicDataFromCallback});
        }
      }
    }
  });

	app.get('/scenes', loggedIn, CheckPreferencesSet, function(req, res){
    pg.GetScenes(ContinueScenes);
    function ContinueScenes(queryResults){
      var scenes = queryResults;
      console.log(scenes.sort(function(a, b){
          return compareStrings(a.name, b.name);
    }));
    function compareStrings(a, b) {
      a = a.toLowerCase();
      b = b.toLowerCase();
      return (a < b) ? -1 : (a > b) ? 1 : 0;
    }
      res.render('scenes', {scenes: scenes, user: req.user});
    }
 	});

  app.post('/set-preferences', loggedIn, function(req, res){
    pg.SetPreferences(req.user.id, req.body, ContinueSetPreferences);
    function ContinueSetPreferences(){
      res.redirect('/profile');
    }
  });

  app.get('/your-scenes', loggedIn, function(req, res){
      res.render('yourscenes', {user: req.user});
  });

  function CheckPreferencesSet(req, res, next){
      pg.CheckPreferencesSet(req.user.id, ContinueCheckPreferencesSet);
      //res.render('scenes', {scenes: scenes});
      function ContinueCheckPreferencesSet(userIsSet){
        if(userIsSet){
          next();
        }else{
          res.render('preferences', {user: req.user, set:false});
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