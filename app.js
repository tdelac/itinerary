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

/* Constants */
var FACEBOOK_APP_ID = secrets.FACEBOOK_APP_ID();
var FACEBOOK_APP_SECRET = secrets.FACEBOOK_APP_SECRET();
var RAND_BUFFER = 5;

/* Dynamic */
var suggestions; // Stored globally for persistence
var glbl_dict;

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
  passport.authenticate('facebook'),
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
  /* If user has requested a new itinerary */
  if (req.body.hasOwnProperty('refresh')) {
    render_new_itinerary(res, glbl_dict, suggestions);
  } 

  /* If user is submitting for the first time */
  else {
    var city = req.body.selector;
    var num_landmarks = req.body.num_landmarks;
    var citysql = "'" + city + "'";
    var sql = 
      queries.get_landmark_by_stars_weighted
        (citysql, num_landmarks * RAND_BUFFER); //1 for now 

    /* Note: refactor this to just be global perhaps? */
    var dict = {
      itinerary: {
        city: city,
        num_landmarks: num_landmarks,
      }
    };

    db(sql, res, dict, render_new_itinerary);
  }
}


//-------------------------------------------------------------
// Database Callback Functions
// ------------------------------------------------------------

/* Not being used right now */
var process_cityform_data = function(res, dict, db_out) {
  var locations = db_out.rows;

  var sql = queries.get_closest_business(latitude, longitude);
  db(sql, res, dict, render_new_itinerary);
}


/* Display the form with output */
var render_new_itinerary = function(res, dict, db_out) {
  /* Save global stuff */
  suggestions = db_out;
  glbl_dict = dict;

  var output = static.array_deep_copy(db_out.rows),
      city = dict.itinerary.city,
      num_landmarks = dict.itinerary.num_landmarks,
      rows = [];

  /* Generate randomized output to display */
  for (var i = 0; i < num_landmarks; ++i) {
    var randomized = Math.floor(Math.random() * (output.length - 1));

    while (output[randomized] == null) {
      randomized = Math.floor(Math.random() * (output.length - 1));
    }

    rows[i] = output[randomized];
    output[randomized] = null;
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
