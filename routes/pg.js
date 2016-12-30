module.exports = function(app){
	// Connect to the pg database
	// req.body.username
	var connect = 'postgres://ulmtmyybrhwbav:c923ffccd482e8d896bedc4ae374ec9ec2181efc5ec562bddaaec9d5fad74b3c@ec2-54-243-38-139.compute-1.amazonaws.com:5432/dbomkrkei16eoj'
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