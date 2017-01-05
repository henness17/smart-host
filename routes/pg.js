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

  app.post('/set-preferences', loggedIn, function(req, res){
    pg.connect(connect, function(err, client, done){
      if(err){
        return console.error('error fetching', err);
      }
      client.query("INSERT INTO public.music(scene_id, coffee_morning) VALUES (1,ARRAY['country', 'rap', 'acoustic'])");
      client.query("INSERT INTO public.lighting(scene_id, coffee_percent) VALUES (1,ARRAY[70, 90, 40])");
      done();
      res.redirect('/');
    });
    pg.end();
  });

  function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
  }
};

