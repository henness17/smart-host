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
      done();
      callback();
    }); 
  };
  module.exports.AddCheckRegistration = AddCheckRegistration;

  var CheckPreferencesSet = function CheckPreferencesSet(id, callback){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM users WHERE fbid=$1', [id], function(err, result){
        if(result.rows[0].set == true){
          done();
          callback(true);
        }else{
          done();
          callback(false);
        }
      });
    }); 
  };
  module.exports.CheckPreferencesSet = CheckPreferencesSet;

  var GetSceneData = function GetSceneData(id, sceneType, timeOfDay, callback){
    pg.connect(connect, function(err, client, done){
      console.log("CONNECTING TO PG");
      var lightingData = [];
      var musicData = [];
      var usersFbids;
      var forEachCounter = 0;
      console.log("GETTING PG DATA");
      client.query('SELECT * FROM scenes WHERE sceneid=$1', [id], function(err, result){
        usersFbids = result.rows[0].usersfbids;
        console.log("Fbids length:" + usersFbids.length);
        usersFbids.forEach(function(fbid) {
          client.query('SELECT * FROM music WHERE fbid=$1', [fbid], function(err, result2){
            musicData.push(result2.rows[0].genre[sceneType][timeOfDay]);
            console.log("Music Data: " + musicData);
            client.query('SELECT * FROM lighting WHERE fbid=$1', [fbid], function(err, result3){
              lightingData.push(result3.rows[0].percent[sceneType][timeOfDay]);
              console.log("Music Data: " + lightingData);
              // Sometimes this function runs..
              forEachCounter++;
              if(forEachCounter == usersFbids.length){
                console.log("END: " + lightingData);
                console.log("END: " + musicData);
                done();
                callback(lightingData, musicData); 
              }
            }); 
          }); 
        });
      });
    });
  }
  module.exports.GetSceneData = GetSceneData;

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
          done();
          callback(general, music, lighting, isInScene);
        });
      }); 
    };
  module.exports.GetSceneDefaults = GetSceneDefaults;

  var GetScenes = function GetScenes(callback){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM scenes', function(err, result){
        done();
        callback(result.rows);
      });
    }); 
  };
  module.exports.GetScenes = GetScenes;

  var GetUsers = function GetUsers(id){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM users', function(err, result){
        done();
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
        done();
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
      client.query('UPDATE public.lighting SET percent=$1, mood=$2 WHERE fbid=$3', [percent, mood, fbid]);
      client.query('UPDATE public.users SET set=TRUE WHERE fbid=$1', [fbid]);
      done();
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

