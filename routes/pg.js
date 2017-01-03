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
      client.query("INSERT INTO public.scenes(sceneid, name) VALUES (2,'White Owl Bar')");
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
};

