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

  var GetUsers = function GetUsers(id){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM users', function(err, result){
        console.log(result.rows);
      });
    }); 
  };
  module.exports.GetUsers = GetUsers;
  
  var GetScenes = function GetScenes(callback){
    pg.connect(connect, function(err, client, done){
      client.query('SELECT * FROM scenes', function(err, result){
        callback(result.rows);
      });
    }); 
  };
  module.exports.GetScenes = GetScenes;

  var GetSceneDefaults = function GetSceneDefaults(id, callback){
    pg.connect(connect, function(err, client, done){
      var general, music, lighting;
      client.query('SELECT * FROM scenes WHERE sceneid=$1', [id], function(err, result){
          general = result.rows;
        }); 
      client.query('SELECT * FROM music WHERE scene_id=$1', [id], function(err, result){
          music = result.rows;
        });
      client.query('SELECT * FROM lighting WHERE scene_id=$1', [id], function(err, result){
          lighting = result.rows;
          callback(general, music, lighting);
        });
      }); 
    };
  module.exports.GetSceneDefaults = GetSceneDefaults;
};

