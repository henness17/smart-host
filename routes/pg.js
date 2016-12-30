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

  app.post('/selectmusic', function(req, res){
    pg.connect(connect, function(err, client, done){
      if(err){
        return console.error('error fetching', err);
      }
      console.log(req.body.music);
      console.log(req.body.music);
      console.log(req.body.music);
      console.log(req.body.music);
      client.query('INSERT INTO public.users('+req.body.music+') VALUES(1)');
      done();
      res.redirect('/');
    });
  });
};