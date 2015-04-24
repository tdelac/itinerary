var express = require('express')
, passport = require('passport')
, util = require('util')
, FacebookStrategy = require('passport-facebook').Strategy
, logger = require('morgan')
, session = require('express-session')
, cookieParser = require("cookie-parser")
, methodOverride = require('method-override')
, secrets = require('./secrets');
var path       = require('path');
var bodyparser = require('body-parser');
var db         = require('./oracle/connectionDriver.js');
var queries    = require('./oracle/queries.js');
var static     = require('./static_funcs.js');
var facebook = require('./facebook');
/* Constants */
var FACEBOOK_APP_ID = secrets.FACEBOOK_APP_ID();
var FACEBOOK_APP_SECRET = secrets.FACEBOOK_APP_SECRET();
var RAND_BUFFER = 5;
var RAND_RESTAURANT = RAND_BUFFER * 5;
var WEEKDAY = new Array(7);
WEEKDAY[0] = "\'Su\'";
WEEKDAY[1] = "\'M\'";
WEEKDAY[2] = "\'Tu\'";
WEEKDAY[3] = "\'W\'";
WEEKDAY[4] = "\'Th\'";
WEEKDAY[5] = "\'F\'";
WEEKDAY[6] = "\'Sa\'";

/* Dynamic */
var glbl_dict = {output: {}} // Global state of itinerary data

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
          
      facebook.getFbData(accessToken, '/me/friends', function(data){
          // returns friends who have logged in with the app
          console.log(data);
      });
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));


var app = express();

// configure Express
  app.set('views', path.join(__dirname, 'templates'));
  app.set('view engine', 'jade');
  app.use(logger());
  app.use(cookieParser());
  app.use(bodyparser.urlencoded({extended: false}));
  app.use(methodOverride());
  app.use(session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));


/* If direct to 'home' page */
app.get('/', function(req, res) {
  process_cityform(req, res);
});

/* On post request from form submission */
app.post('/', function(req, res) {
  process_cityform_post(req, res);
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook', {scope: ['user_friends']}),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}



//-------------------------------------------------------------
// Process Incoming Request Functions
// ------------------------------------------------------------

var process_cityform = function(req, res) {
  render_cityform(res);
}

var process_cityform_post = function(req, res) {
  // Set date
  glbl_dict.day = WEEKDAY[(new Date()).getDay()];

  // Retrieve what is currently outputted
  var breakfast = glbl_dict.output.breakfast,
      lunch = glbl_dict.output.lunch,
      dinner = glbl_dict.output.dinner;

  /* User requests different breakfast option */
  if (req.body.hasOwnProperty('new_breakfast')) {
    var new_breakfast = glbl_dict.breakfast[static.rand(RAND_RESTAURANT)];

    // Generate a new, unique breakfast option
    while (new_breakfast[0] === lunch[0] || 
           new_breakfast[0] === dinner[0] || 
           new_breakfast[0] === breakfast[0]) {
      new_breakfast = glbl_dict.breakfast[static.rand(RAND_RESTAURANT)];      
    }

    glbl_dict.output.breakfast = new_breakfast; // Update global
    render_form_itinerary(res);
    return;
  }

  /* User requests different lunch option */
  if (req.body.hasOwnProperty('new_lunch')) {
    var new_lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];

    // Generate a new, unique breakfast option
    while (new_lunch[0] === lunch[0] || 
           new_lunch[0] === dinner[0] || 
           new_lunch[0] === breakfast[0]) {
      new_lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];      
    }

    glbl_dict.output.lunch = new_lunch; // Update global
    render_form_itinerary(res);
    return;
  }

  /* User requerst different dinner option */
  if (req.body.hasOwnProperty('new_dinner')) {
    var new_dinner = glbl_dict.dinner[static.rand(RAND_RESTAURANT)];

    // Generate a new, unique breakfast option
    while (new_dinner[0] === lunch[0] || 
           new_dinner[0] === dinner[0] || 
           new_dinner[0] === breakfast[0]) {
      new_dinner = glbl_dict.dinner[static.rand(RAND_RESTAURANT)];      
    }

    glbl_dict.output.dinner = new_dinner; // Update global
    render_form_itinerary(res);
    return;
  }

  /* If user requests new set of landmarks */
  if (req.body.hasOwnProperty('refresh')) {
    var output = static.array_deep_copy(glbl_dict.landmarks),
        rows = [];

    for(var i = 0; i < glbl_dict.num_landmarks; ++i) {
      var randomized = static.rand(output.length - 1);

      while (output[randomized] == null) {
        randomized = static.rand(output.length - 1);
      }

      rows[i] = output[randomized];
      output[randomized] = null;
    }

    glbl_dict.output.events = rows;
    render_form_itinerary(res);
    return;
  } 

  /* If user is submitting for the first time */
  else {
    var city = req.body.selector;
    var num_landmarks = req.body.num_landmarks;
    var citysql = "'" + city + "'";
    var sql = 
      queries.get_breakfast_by_stars_weighted
        (citysql, glbl_dict.day, RAND_RESTAURANT);

    /* Setup the global itinerary object */
    glbl_dict.city = city;
    glbl_dict.num_landmarks = num_landmarks;

    db(sql, res, process_breakfast);
  }
}


//-------------------------------------------------------------
// Database Callback Functions
// ------------------------------------------------------------

/* Not being used right now */
var process_cityform_data = function(res, db_out) {
  var locations = db_out.rows;

  var sql = queries.get_closest_business(latitude, longitude);
  db(sql, res, make_new_itinerary);
}

/* Process breakfast search query */
var process_breakfast = function(res, db_out) {
  glbl_dict.breakfast = db_out.rows;
  
  var sql = 
    queries.get_lunch_by_stars_weighted
      ("'" + glbl_dict.city + "'", glbl_dict.day, RAND_RESTAURANT);

  db(sql, res, process_lunch);
}

/* Process lunch search query */
var process_lunch = function(res, db_out) {
  glbl_dict.lunch = db_out.rows;
  
  var sql = 
    queries.get_dinner_by_stars_weighted
      ("'" + glbl_dict.city + "'", glbl_dict.day, RAND_RESTAURANT);

  db(sql, res, process_dinner);
}

/* Process dinner search query */
var process_dinner = function(res, db_out) {
  glbl_dict.dinner = db_out.rows;
  
  var sql = 
    queries.get_landmark_by_stars_weighted
      ("'" + glbl_dict.city + "'", glbl_dict.day, glbl_dict.num_landmarks * RAND_BUFFER);

  db(sql, res, make_new_itinerary);
}

/* Display the form with output */
var make_new_itinerary = function(res, db_out) {
  glbl_dict.landmarks = db_out.rows;

  var output = static.array_deep_copy(db_out.rows),
      city = glbl_dict.city,
      num_landmarks = glbl_dict.num_landmarks,
      rows = [],
      breakfast = glbl_dict.breakfast[static.rand(RAND_RESTAURANT)], 
      lunch  = glbl_dict.lunch[static.rand(RAND_RESTAURANT)],
      dinner = glbl_dict.dinner[static.rand(RAND_RESTAURANT)];

  /* Make sure eateries are unique */
  while (lunch[0] === breakfast[0]) {
    lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];
  }
  while (dinner[0] === lunch[0] || dinner[0] === breakfast[0]) {
    dinner = glbl_dict.dinner[static.rand(RAND_RESTAURANT)];
  }

  /* Generate randomized landmark ouput to display */
  for (var i = 0; i < num_landmarks; ++i) {
    var randomized = static.rand(output.length - 1);

    while (output[randomized] == null) {
      randomized = static.rand(output.length - 1);
    }

    rows[i] = output[randomized];
    output[randomized] = null;

    /* Fux with time stuff */
    var open = rows[i][3],
        close = rows[i][4];
  }

  /* Build add output to be rendered to global state */
  glbl_dict.output = 
      {city: city,
       events: rows,
       breakfast: breakfast,
       lunch: lunch,
       dinner: dinner
      };

  /* Render */
  render_form_itinerary(res);
}


//-------------------------------------------------------------
// Rendering Functions
// ------------------------------------------------------------

/* Display the form without output */
var render_cityform = function(res) {
  res.render('form');
}

/* Display the form with output */
var render_form_itinerary = function(res) {
  res.render('form', glbl_dict.output);
}
