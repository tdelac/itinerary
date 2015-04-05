var express    = require('express');
var path       = require('path');
var db         = require('./oracle/connectionDriver.js');
var bodyparser = require('body-parser');

var app = express();

/* App setup */
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');
app.use(bodyparser.urlencoded({extended: false}));

/* If direct to 'home' page */
app.get('/home', function(req, res) {
  render_form(res);
});

/* On post request from form submission */
app.post('/home', function(req, res) {
  var sql = req.body.query; 
  db(sql, render_out, res); // HOF ftw
});

/* Port */
app.listen(process.argv[2]);


//-------------------------------------------------------------
// Rendering Functions
// ------------------------------------------------------------

/* Display the form without output */
var render_form = function(res) {
  res.render('form');
}

/* Display the form with output */
var render_out = function(res, db_out) {
  res.render('form', {out: db_out.rows});
}
