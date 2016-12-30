module.exports = function(app){
	// routes must include passport
	require('./passport.js')(app);

	app.get('/', function(req, res){
    	res.render('index', {user: req.user});
  	});
};