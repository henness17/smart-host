// index.js
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 5000);
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Set routes
require('./routes/routes.js')(app);
require('./routes/passport.js')(app);
require('./routes/pg.js')(app);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});