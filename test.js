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
app.get('/', function(req, res) {
  process_cityform(req, res);
});

/* On post request from form submission */
app.post('/', function(req, res) {
  process_cityform_post(req, res);
});

/* Port */
app.listen(process.argv[2]);


//-------------------------------------------------------------
// Process Incoming Request Functions
// ------------------------------------------------------------

var process_cityform = function(req, res) {
  render_cityform(res);
}

var process_cityform_post = function(req, res) {
  var x = "'" + req.body.selector + "'";
  var sql = "SELECT latitude, longitude "
            + "FROM CITY "
            + "WHERE CITY_NAME=" + x; 

  db(sql, res, process_cityform_data);
}


//-------------------------------------------------------------
// Database Callback Functions
// ------------------------------------------------------------

var process_cityform_data = function(res, db_out) {
  var locations = db_out.rows;

  if (locations.length != 1) {
    console.log("City not supported"); return;
  }

  var latitude  = locations[0][0],
      longitude = locations[0][1];

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

  db(sql, res, render_new_itinerary);
}

/* Display the form with output */
var render_new_itinerary = function(res, db_out) {
  res.render('form', {out: db_out.rows});
}


//-------------------------------------------------------------
// Rendering Functions
// ------------------------------------------------------------

/* Display the form without output */
var render_cityform = function(res) {
  res.render('form');
}
