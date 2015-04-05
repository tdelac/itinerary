var express    = require('express');
var path       = require('path');
var db         = require('./oracle/connectionDriver.js');
var bodyparser = require('body-parser');

var app = express();
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');
app.use(bodyparser.urlencoded({extended: false}));
app.get('/home', function(req, res) {
  render_form(res);
});
app.post('/home', function(req, res) {
  var sql = req.body.query; 
  db(sql, render_out, res);
});
app.listen(process.argv[2]);

var render_form = function(res) {
  res.render('form');
}

var render_out = function(res, result) {
  res.render('form', {out: result.rows});
}
