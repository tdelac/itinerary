var express = require('express');
var path    = require('path');
var db      = require('./oracle/connectionDriver.js');

var sql = "SELECT * FROM Business WHERE rownum < 4";

var app = express();
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');
app.get('/home', function(req, res) {
  db(sql, render, res);
});
app.listen(process.argv[2]);

var render = function(res, db_res) {
  res.render('index', {qoutput: db_res.rows});
}
