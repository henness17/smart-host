module.exports = function(app){
  var passport = require('passport');
  var Strategy = require('passport-facebook').Strategy;
  app.use(require('morgan')('combined'));
  app.use(require('cookie-parser')());
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
  var cbURL = process.env.PASSPORT_CALLBACK;
  passport.use(new Strategy({
      clientID: process.env.PASSPORT_CLIENT_ID,
      clientSecret: process.env.PASSPORT_CLIENT_SECRET,
    	callbackURL: cbURL
  	},
  	function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    	return cb(null, profile);
  	}));
	
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser(function(user, cb) {
  		cb(null, user);
	 });

	passport.deserializeUser(function(obj, cb) {
  		cb(null, obj);
	 });

  app.get('/login/facebook',
    passport.authenticate('facebook'));

  app.get('/login/facebook/return', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  app.get('/logout/facebook', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/logout/facebook/return', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
  });
};