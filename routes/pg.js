module.exports = function(app){
	// Connect to the pg database
	// req.body.username
	var connect = process.env.PG_CONNECT;
	var pg = require('pg'),
  		bodyParser = require('body-parser'),
  		path = require('path');
	pg.defaults.ssl = true;
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false}));

  app.post('/lightingpreference', loggedIn, function(req, res){
    pg.connect(connect, function(err, client, done){
      if(err){
        return console.error('error fetching', err);
      }
      client.query('INSERT INTO public.users(fbid, lighting) VALUES('+req.user.id+','+req.body.lighting+')');
      done();
      res.redirect('/');
    });
  });

  function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
  }
};