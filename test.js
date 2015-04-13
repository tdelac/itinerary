var express    = require('express');
var path       = require('path');
var bodyparser = require('body-parser');
var db         = require('./oracle/connectionDriver.js');
var queries    = require('./oracle/queries.js');

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
  var city = req.body.selector;
  var citysql = "'" + city + "'";
  var num_places = 12;
  var sql = queries.get_landmark_by_stars(citysql, num_places * 1); //1 for now 

  var dict = {
    itinerary: {
      city: city,
      num_places: num_places,
    }
  };

  db(sql, res, dict, render_new_itinerary);
}


//-------------------------------------------------------------
// Database Callback Functions
// ------------------------------------------------------------

var process_cityform_data = function(res, dict, db_out) {
  var locations = db_out.rows;

  var sql = queries.get_closest_business(latitude, longitude);
  db(sql, res, dict, render_new_itinerary);
}

/* Display the form with output */
var render_new_itinerary = function(res, dict, db_out) {
  var ouput = db_out.rows;

  var city = dict.itinerary.city,
      num_places = dict.itinerary.num_places,
      rows = [];

  for (var i = 0; i < num_places; ++i) {
    rows[i] = ouput[i];
  }

  res.render(
      'form', 
      {city: city,
       events: rows}
  );
}


//-------------------------------------------------------------
// Rendering Functions
// ------------------------------------------------------------

/* Display the form without output */
var render_cityform = function(res) {
  res.render('form');
}
