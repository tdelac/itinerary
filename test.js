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
  process_form_get(req, res, render_form);
});

/* On post request from form submission */
app.post('/home', function(req, res) {
  process_form_post(req, res, process_form_data);
});

/* Port */
app.listen(process.argv[2]);


//-------------------------------------------------------------
// Process Incoming Request Functions
// ------------------------------------------------------------

var process_form_get = function(req, res, cb) {
  cb(res);
}

var process_form_post = function(req, res, cb) {
  var x = "'" + req.body.selector + "'";
  var sql = "SELECT latitude, longitude "
            + "FROM CITY "
            + "WHERE CITY_NAME=" + x; 

  db(sql, res, cb);
}

var process_form_data = function(res, db_out) {
  var locations = db_out.rows;

  if (locations.length != 1) {
    console.log("City not supported"); return;
  }

  var latitude  = locations[0][0],
      longitude = locations[0][1];

  console.log(latitude);
  console.log(longitude);

  var sql = "WITH closest_business AS ( " 
            + "SELECT b.business_id, b.name, "
              + "(ACOS(SIN(3.14*b.latitude/180.0)*SIN(3.14*"+latitude+"/180.0)+" 
              + "COS(3.14*b.latitude/180.0)*COS(3.14*"+latitude+"/180.0)*"
              + "COS(3.14*"+longitude+"/180.0-3.14*b.longitude/180.0))) AS distance "
            + "FROM business b "
            + "ORDER BY distance asc) "
            + "SELECT name "
            + "FROM closest_business cb " // DONT FORGET THE GODDAMNED SPACES
            + "INNER JOIN landmark l on l.business_id = cb.business_id";

  db(sql, res, render_out);
}


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
