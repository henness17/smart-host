module.exports = function(app){
	// Connect to the pg database
	// req.body.username
  require('./passport.js')(app);
  var connect = process.env.PG_CONNECT;
  var pg = require('pg'),
      bodyParser = require('body-parser'),
      path = require('path');
  pg.defaults.ssl = true;
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false}));

  var AddCheckRegistration = function AddCheckRegistration(id, callback){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM users WHERE fbid=$1', [id], function(err, result){
        if(!(result.rows.length > 0)){
          client.query('INSERT INTO users (fbid) VALUES ($1)', [id], function(err, result){
            console.log('User added');
          });
          client.query('INSERT INTO music (fbid) VALUES ($1)', [id], function(err, result){
            console.log('Music added');
          });
          client.query('INSERT INTO lighting (fbid) VALUES ($1)', [id], function(err, result){
            console.log('Lighting added');
          });
        }
      });
      callback();
    }); 
  };
  module.exports.AddCheckRegistration = AddCheckRegistration;

  var AddCheckSet = function AddCheckSet(id, callback){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM users WHERE fbid=$1', [id], function(err, result){
        if(result.rows[0].set == true){
          callback(true);
        }else{
          callback(false);
        }
      });
    }); 
  };
  module.exports.AddCheckSet = AddCheckSet;

  var GetSceneDefaults = function GetSceneDefaults(id, userFbid, callback){
    pg.connect(connect, function(err, client, done){
      var general, music, lighting, isInScene;
      client.query('SELECT * FROM users WHERE fbid=$1', [userFbid], function(err, result){
        if(result.rows[0].inscene == id){
          isInScene = true;
        }else{
          isInScene = false;
        }
      });
      client.query('SELECT * FROM scenes WHERE sceneid=$1', [id], function(err, result){
          general = result.rows;
        }); 
      client.query('SELECT * FROM music WHERE sceneid=$1', [id], function(err, result){
          music = result.rows;
        });
      client.query('SELECT * FROM lighting WHERE sceneid=$1', [id], function(err, result){
          lighting = result.rows;
          callback(general, music, lighting, isInScene);
        });
      }); 
    };
  module.exports.GetSceneDefaults = GetSceneDefaults;

  var GetScenes = function GetScenes(callback){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM scenes', function(err, result){
        callback(result.rows);
      });
    }); 
  };
  module.exports.GetScenes = GetScenes;

  var GetUsers = function GetUsers(id){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM users', function(err, result){
        console.log(result.rows);
      });
    }); 
  };
  module.exports.GetUsers = GetUsers;

  var JoinScene = function JoinScene(fbid, sceneid, callback){
    pg.connect(connect, function(err, client, done){
      if(err){
        return console.error('error fetching', err);
      }
      var usersFbids;
      // Add user to scene's usersfbids
      client.query("SELECT * FROM scenes WHERE sceneid=$1", [sceneid], function(err, result){
        usersFbids = result.rows[0].usersfbids;
        usersFbids.push(fbid);
        client.query("UPDATE public.scenes SET usersfbids=$2 WHERE sceneid=$1", [sceneid, usersFbids]);
      });
      // Add scene to user's inscene
      client.query("SELECT * FROM public.users WHERE fbid=$1", [fbid], function(err, result){
        if(result.rows[0].inscene != undefined){
          // Remove from old scene's usersfbids
          client.query("SELECT * FROM public.scenes WHERE sceneid=$1", [result.rows[0].inscene], function(err, result2){
            var usersFbids = result2.rows[0].usersfbids;
            var indexOfUser = usersFbids.indexOf(fbid);
            if (indexOfUser > -1) {
              usersFbids.splice(indexOfUser, 1);
            }
            client.query("UPDATE public.scenes SET usersfbids=$1 WHERE sceneid=$2", [usersFbids, result.rows[0].inscene]);
          });
        }
        // Update user's inscene
        client.query("UPDATE public.users SET inscene=$1 WHERE fbid=$2", [sceneid, fbid]);
        done();
        callback();
      });
    });
    pg.end();
  };
  module.exports.JoinScene = JoinScene;

  var LeaveScene = function LeaveScene(fbid, callback){
    pg.connect(connect, function(err, client, done){
      client.query("SELECT * FROM public.users WHERE fbid=$1", [fbid], function(err, result){
        if(result.rows[0].inscene != undefined){
          // Remove from old scene's usersfbids
          client.query("SELECT * FROM public.scenes WHERE sceneid=$1", [result.rows[0].inscene], function(err, result2){
            var usersFbids = result2.rows[0].usersfbids;
            var indexOfUser = usersFbids.indexOf(fbid);
            if (indexOfUser > -1) {
              usersFbids.splice(indexOfUser, 1);
            }
            client.query("UPDATE public.scenes SET usersfbids=$1 WHERE sceneid=$2", [usersFbids, result.rows[0].inscene]);
          });
        }
      });
      client.query('UPDATE public.users SET inscene=null WHERE fbid=$1', [fbid], function(err, result){
        callback();
      });
    }); 
  };
  module.exports.LeaveScene = LeaveScene;

  var SetPreferences = function SetPreferences(fbid, formResults, callback){
    var genre = [[formResults.musicCoffeeMorning, formResults.musicCoffeeNoon, formResults.musicCoffeeNight], [formResults.musicBarMorning, formResults.musicBarNoon, formResults.musicBarNight]];
    var percent = [[formResults.lightingCoffeeMorningPercent,formResults.lightingCoffeeNoonPercent,formResults.lightingCoffeeNightPercent], [formResults.lightingBarMorningPercent,formResults.lightingBarNoonPercent,formResults.lightingBarNightPercent]];
    var mood = [[formResults.lightingCoffeeMorningMood, formResults.lightingCoffeeNoonMood, formResults.lightingCoffeeNightMood], [formResults.lightingBarMorningMood, formResults.lightingBarNoonMood, formResults.lightingBarNightMood]];
    // Music table
    pg.connect(connect, function(err, client, done){
      client.query('UPDATE public.music SET genre=$1 WHERE fbid=$2', [genre, fbid]);
    }); 
    // Lighting table
    pg.connect(connect, function(err, client, done){
      client.query('UPDATE public.lighting SET percent=$1, mood=$2 WHERE fbid=$3', [percent, mood, fbid]);
    }); 
    // Users table
    pg.connect(connect, function(err, client, done){
      client.query('UPDATE public.users SET set=TRUE WHERE fbid=$1', [fbid]);
      callback();
    }); 
  };
  module.exports.SetPreferences = SetPreferences;

  function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
  }
};

