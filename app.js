var express = require('express')
, passport = require('passport')
, util = require('util')
, FacebookStrategy = require('passport-facebook').Strategy
, logger = require('morgan')
, session = require('express-session')
, cookieParser = require("cookie-parser")
, methodOverride = require('method-override')
, secrets = require('./secrets')
, path       = require('path')
, bodyparser = require('body-parser')
, db         = require('./oracle/connectionDriver.js')
, queries    = require('./oracle/queries.js')
, static     = require('./static_funcs.js')
, facebook = require('./facebook')
, yelp = require('./yelp')
, xml2js = require('xml2js');


//--------------------------------------------------------------
// GLOBAL CONSTANTS
// -------------------------------------------------------------

var FACEBOOK_APP_ID = secrets.FACEBOOK_APP_ID()
, FACEBOOK_APP_SECRET = secrets.FACEBOOK_APP_SECRET()
, YELP_CONSUMER = secrets.YELP_CONSUMER()
, YELP_CONSUMER_SECRET = secrets.YELP_CONSUMER_SECRET()
, YELP_TOKEN = secrets.YELP_TOKEN()
, YELP_TOKEN_SECRET = secrets.YELP_TOKEN_SECRET()
, RAND_BUFFER = 20
, RAND_RESTAURANT = RAND_BUFFER
, WEEKDAY = new Array(7);

WEEKDAY[0] = "\'Su\'";
WEEKDAY[1] = "\'M\'";
WEEKDAY[2] = "\'Tu\'";
WEEKDAY[3] = "\'W\'";
WEEKDAY[4] = "\'Th\'";
WEEKDAY[5] = "\'F\'";
WEEKDAY[6] = "\'Sa\'";


//--------------------------------------------------------------
// GLOBAL DYNAMIC DATA
// -------------------------------------------------------------

var glbl_dict = {properties: {}, output: {}} // Global state of itinerary data

//--------------------------------------------------------------
// FACEBOOK API
// -------------------------------------------------------------

/* Dynamic */
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
    callbackURL: "/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
          
      facebook.getFbData(accessToken, '/me/friends', function(data){
          // data is given as a string so either parse or use re: /(.*\[+)(.*)(\].*)/;
          var obj = JSON.parse(data);
          var friends = obj.data;
          console.log(friends);
          glbl_dict.friends = friends;
      });
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

//--------------------------------------------------------------
// YELP API
// -------------------------------------------------------------

var yelp_api_instance = require("yelp").createClient({
  consumer_key: YELP_CONSUMER,
  consumer_secret: YELP_CONSUMER_SECRET,
  token: YELP_TOKEN,
  token_secret: YELP_TOKEN_SECRET
});

//--------------------------------------------------------------
// APP SETUP
// -------------------------------------------------------------

var app = express();

app.set('views', path.join(__dirname, 'public'));
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


//--------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

/* If direct to 'home' page */
app.get('/', ensureAuthenticated, function(req, res) {
  process_cityform(req, res);
});

/* On post request from form submission */
app.post('/', ensureAuthenticated, function(req, res) {
  process_cityform_post(req, res);
});

app.get('/itinerary', function(req, res) {
  res.redirect('/');
});

app.post('/itinerary', ensureAuthenticated, function(req, res) {
  process_itinerary_display(req, res);
});

app.get('/account', ensureAuthenticated, function(req, res){
  process_account_get(req, res)
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

/* Display an (uneditable) itinerary */
var process_itinerary_display = function(req, res) {
  var user_id = req.body.user_id,
      itinerary_id = req.body.itinerary_id;

  console.log(itinerary_id);

  var sql = 
    queries.get_itinerary(user_id, itinerary_id);

  console.log(1);

  db(sql, res, render_itinerary_display);
}

/* Basically where all the non-database action is */
var process_cityform_post = function(req, res) {
  var date = new Date(),
      formatted_date = date.getFullYear() + "/" + 
        (date.getMonth() + 1) + "/" + date.getDate();
  // Set date
  glbl_dict.day = WEEKDAY[date.getDay()];

  // Retrieve what is currently outputted
  var breakfast = glbl_dict.output.breakfast,
      lunch = glbl_dict.output.lunch,
      dinner = glbl_dict.output.dinner;

  /* User opts to save itinerary */
  if (req.body.hasOwnProperty('save_itinerary')) {
    var itinerary_xml = static.xml_of_itinerary(glbl_dict.output);

    var sql = 
      queries.insert_new_itinerary(req.user.id, 
          glbl_dict.output.city, formatted_date, itinerary_xml);

    console.log(2);

    db(sql, res, render_form_after_save);
    return;
  }

  /* User requests different breakfast option */
  if (req.body.hasOwnProperty('new_breakfast')) {
    var new_breakfast = glbl_dict.breakfast[static.rand(RAND_RESTAURANT)];

    // Generate a new, unique breakfast option
    while (new_breakfast[0] === lunch[0] || 
           new_breakfast[0] === dinner[0] || 
           new_breakfast[0] === breakfast[0]) {
      new_breakfast = glbl_dict.breakfast[static.rand(RAND_RESTAURANT)];      
    }

    // Add url info to eatery. Should really get abstracted away */
    yelp.get_url(yelp_api_instance, new_breakfast[0], glbl_dict.city, function(url) {
      if (url) {
        new_breakfast[7] = url; // Associate url with this breakfast place
        glbl_dict.output.breakfast = new_breakfast;
      }

      render_form_itinerary(res);
    });
    return;
  }

  /* User requests different lunch option */
  if (req.body.hasOwnProperty('new_lunch')) {
    var new_lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];
    console.log("whyyyy");

    // Generate a new, unique breakfast option
    // Possible weak point for inf loop
    while (new_lunch[0] === lunch[0] || 
           new_lunch[0] === dinner[0] || 
           new_lunch[0] === breakfast[0]) {
      new_lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];      
    }

    yelp.get_url(yelp_api_instance, new_lunch[0], glbl_dict.city, function(url) {
      if (url) {
        new_lunch[7] = url; // Associate url with this breakfast place
        glbl_dict.output.lunch = new_lunch; 
      }

      render_form_itinerary(res);
    });
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

    yelp.get_url(yelp_api_instance, new_dinner[0], glbl_dict.city, function(url) {
      if (url) {
        new_dinner[7] = url; // Associate url with this breakfast place
        glbl_dict.output.dinner = new_dinner; 
      }

      render_form_itinerary(res);
    });
    return;
  }

  /* If user requests new set of landmarks */
  if (req.body.hasOwnProperty('new_morning')) {
    var all_morning = static.array_deep_copy(glbl_dict.morning_landmarks),
        index = req.body.new_morning;

    var new_event = static.rand_unique_event(all_morning, glbl_dict.output);

    yelp.get_url(yelp_api_instance, new_event[0], glbl_dict.city, function(url) {
      if (url) {
        new_event[7] = url; // Associate url with this breakfast place
        glbl_dict.output.morning[index] = new_event;
      }

      render_form_itinerary(res);
    });
    return;
  } 

  if (req.body.hasOwnProperty('new_afternoon')) {
    var all_afternoon = static.array_deep_copy(glbl_dict.afternoon_landmarks),
        index = req.body.new_afternoon;

    var new_event = static.rand_unique_event(all_afternoon, glbl_dict.output);

    yelp.get_url(yelp_api_instance, new_event[0], glbl_dict.city, function(url) {
      if (url) {
        new_event[7] = url; // Associate url with this breakfast place
        glbl_dict.output.afternoon[index] = new_event;
      }

      render_form_itinerary(res);
    });
    return;
  } 

  if (req.body.hasOwnProperty('new_evening')) {
    var all_evening = static.array_deep_copy(glbl_dict.evening_landmarks),
        index = req.body.new_evening;

    var new_event = static.rand_unique_event(all_evening, glbl_dict.output);

    yelp.get_url(yelp_api_instance, new_event[0], glbl_dict.city, function(url) {
      if (url) {
        new_event[7] = url; // Associate url with this breakfast place
        glbl_dict.output.evening[index] = new_event;
      }

      render_form_itinerary(res);
    });
    return;
  } 

  /* If user is submitting for the first time */
  else {
    var city = req.body.selector;
    var num_landmarks = req.body.num_landmarks;
    var citysql = "'" + city + "'";

    var sql = 
      queries.get_breakfast_by_stars_weighted_utility
        (citysql, glbl_dict.day, RAND_RESTAURANT, 5, 3.5);

    /* Setup the global itinerary object */
    glbl_dict.city = city;
    glbl_dict.num_morning = Math.ceil(num_landmarks / 4);
    glbl_dict.num_evening = Math.ceil((num_landmarks - glbl_dict.num_morning) / 4);
    glbl_dict.num_afternoon = 
      num_landmarks - glbl_dict.num_morning - glbl_dict.num_evening;
    console.log(3);
    db(sql, res, process_breakfast);
  }
}

/* Retrieve info necessary to display the account page */
process_account_get = function(req, res) {
  glbl_dict.user = req.user;
  
  var sql = 
    queries.get_itineraries_given_user(req.user.id);
  console.log(4);
  db(sql, res, render_account);
}


//-------------------------------------------------------------
// Database Callback Functions
// ------------------------------------------------------------

/* Not being used right now */
var process_cityform_data = function(res, db_out) {
  var locations = db_out.rows;

  var sql = queries.get_closest_business(latitude, longitude);
  console.log(5);
  db(sql, res, make_new_itinerary);
}

/* Process breakfast search query */
var process_breakfast = function(res, db_out) {
  glbl_dict.breakfast = db_out.rows;
  
  /* Pre-determine breakfast for morning query info */
  var breakfast = glbl_dict.breakfast[static.rand(RAND_RESTAURANT)]; 
  glbl_dict.output.breakfast = breakfast; 

  /* Use yelp api to retrieve additional business info */
  yelp.get_url(yelp_api_instance, breakfast[0], glbl_dict.city, function(url) {
    if (url) {
      glbl_dict.output.breakfast[7] = url; // Associate url with this breakfast place
    }

    var sql = 
      queries.get_lunch_by_stars_weighted_utility
        ("'" + glbl_dict.city + "'", glbl_dict.day, RAND_RESTAURANT, 5, 3.5);
    console.log(6);
    db(sql, res, process_lunch);
  });
}

/* Process lunch search query */
var process_lunch = function(res, db_out) {
  glbl_dict.lunch = db_out.rows;
  
  var breakfast = glbl_dict.output.breakfast,
      lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];

  /* Make sure eateries are unique */
  while (lunch[0] === breakfast[0]) {
    lunch = glbl_dict.lunch[static.rand(RAND_RESTAURANT)];
  }
  glbl_dict.output.lunch = lunch;
  
  /* Use yelp api to retrieve additional business info */
  yelp.get_url(yelp_api_instance, lunch[0], glbl_dict.city, function(url) {
    if (url) {
      glbl_dict.output.lunch[7] = url; // Associate url with this breakfast place
    }

    var sql = 
      queries.get_dinner_by_stars_weighted_utility
        ("'" + glbl_dict.city + "'", glbl_dict.day, RAND_RESTAURANT, 5, 3.5);
    console.log(7);
    db(sql, res, process_dinner);
  });
}

/* Process dinner search query */
var process_dinner = function(res, db_out) {
  glbl_dict.dinner = db_out.rows;

  var breakfast = glbl_dict.output.breakfast,
      lunch = glbl_dict.output.lunch,
      dinner = glbl_dict.dinner[static.rand(RAND_RESTAURANT)];

  while (dinner[0] === lunch[0] || dinner[0] === breakfast[0]) {
    dinner = glbl_dict.dinner[static.rand(RAND_RESTAURANT)];
  }
  glbl_dict.output.dinner = dinner;

  /* Use yelp api to retrieve additional business info */
  yelp.get_url(yelp_api_instance, dinner[0], glbl_dict.city, function(url) {
    if (url) {
      glbl_dict.output.dinner[7] = url; // Associate url with this breakfast place
    }

    // Anchor these events to lunch
    var sql = 
      queries.get_morning_landmark_by_stars_dist_weighted_utility(
          "'" + glbl_dict.city + "'" 
        , glbl_dict.day 
        , glbl_dict.num_morning * RAND_BUFFER
        , glbl_dict.output.lunch[5] // lat
        , glbl_dict.output.lunch[6] // long
        , 5
        , 3.5
      );
    console.log(8);
    db(sql, res, process_morning_landmarks);
  });
}

/* Process morning landmark query search */
var process_morning_landmarks = function(res, db_out) {
  glbl_dict.morning_landmarks = db_out.rows;
  
  var sql = 
    queries.get_afternoon_landmark_by_stars_dist_weighted_utility(
        "'" + glbl_dict.city + "'"
      , glbl_dict.day
      , glbl_dict.num_afternoon * RAND_BUFFER
      , glbl_dict.output.lunch[5] // lat
      , glbl_dict.output.lunch[6] // long
      , 5
      , 3.5
    );
  console.log(9);
  db(sql, res, process_afternoon_landmarks);
}

/* Process afternoon landmark query search */
var process_afternoon_landmarks = function(res, db_out) {
  glbl_dict.afternoon_landmarks = db_out.rows;
  
  var sql = 
    queries.get_evening_landmark_by_stars_dist_weighted_utility(
        "'" + glbl_dict.city + "'"
      , glbl_dict.day
      , glbl_dict.num_evening * RAND_BUFFER
      , glbl_dict.output.dinner[5]
      , glbl_dict.output.dinner[6]
      , 5
      , 3.5
    );
  console.log(10);
  db(sql, res, make_new_itinerary);
}

/* Display the form with output */
var make_new_itinerary = function(res, db_out) {
  glbl_dict.evening_landmarks = db_out.rows;

  // Pretty format time for all recs
  static.format_time(glbl_dict.morning_landmarks);
  static.format_time(glbl_dict.afternoon_landmarks);
  static.format_time(glbl_dict.evening_landmarks);
  static.format_time(glbl_dict.breakfast);
  static.format_time(glbl_dict.lunch);
  static.format_time(glbl_dict.dinner);

  var all_morning = static.array_deep_copy(glbl_dict.morning_landmarks),
      all_afternoon = static.array_deep_copy(glbl_dict.afternoon_landmarks),
      all_evening = static.array_deep_copy(glbl_dict.evening_landmarks),
      city = glbl_dict.city;

  /* Retrieve all landmark activities */
  var morning = 
    static.closest_unique_set(all_morning, glbl_dict.num_morning, [], yelp);
  var afternoon = 
    static.closest_unique_set(all_afternoon, glbl_dict.num_afternoon, morning, yelp);
  var evening = 
    static.closest_unique_set(all_evening, glbl_dict.num_evening, morning.concat(afternoon), yelp);

  /* Add all extra yelp data to event sets */
  yelp.apify_set(morning, yelp_api_instance, city, function() {
    yelp.apify_set(afternoon, yelp_api_instance, city, function() {
      yelp.apify_set(evening, yelp_api_instance, city, function() {
        /* Build add output to be rendered to global state */
        glbl_dict.output.city = city;
        glbl_dict.output.morning = morning;
        glbl_dict.output.afternoon = afternoon;
        console.log(glbl_dict.output.afternoon);
        glbl_dict.output.evening = evening;

        /* Render */
        render_form_itinerary(res);
      });
    });
  });
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

/* Display the form with confirmation of save */
var render_form_after_save = function(res, db_out) {
  res.render('form', {save: "success"});
}

/* Display account page */
var render_account = function(res, db_out) {
  var itineraries = db_out.rows;

  for (var i = 0; i < itineraries.length; ++i) {
    itineraries[i][2] = static.pretty_date(itineraries[i][2]);
  }

  var output = {
    user: glbl_dict.user,
    friends: glbl_dict.friends,
    itineraries: itineraries
  }

  res.render('account', output);
  /*
  var xml = db_out.rows,
      joined = "<root>" + xml.join("") + "</root>";
      xml_parser = new xml2js.Parser();
*/
      /*
  xml_parser.parseString(joined, function(err, result) {
    if (err) {
      console.log(err.message);
      return;
    }

    if (result) {
      var itineraries = result.root.itinerary;
      var output = {
        user: glbl_dict.user,
        friends: glbl_dict.friends,
        itineraries: []
      };
      for (var i = 0; i < list.length; ++i) {
        var input = itineraries[i],
            date = Date.parse(input.date),
            formatted_date = date.getMonth() + 1 + "/" + 
              date.getDate() + "/" + date.getYear();

        output.itineraries[i] = 
        {
          date: formatted_date,
          city: input.city,
          
        };
      }
    }

    res.render('account', output); 
  });*/
}

var render_itinerary_display = function(res, db_out) {
  var xml = db_out.rows,
      xml_parser = new xml2js.Parser();

  xml_parser.parseString(xml, function(err, result) {
    if (err) {
      console.log(err.message);
      return;
    }

    if (result) {
      var output = {};

      var breakfast = 
        static.build_event(result.itinerary.breakfast[0]);
      var lunch = 
        static.build_event(result.itinerary.lunch[0]);
      var dinner = 
        static.build_event(result.itinerary.dinner[0]);
      var morning = 
        static.build_events(result.itinerary.morning[0].event);
      var afternoon = 
        static.build_events(result.itinerary.afternoon[0].event);
      var evening = 
        static.build_events(result.itinerary.evening[0].event);

      console.log(morning);
      console.log(afternoon);
      console.log(evening);
      output.breakfast = breakfast;
      output.lunch = lunch;
      output.dinner = dinner;
      output.morning = morning;
      output.afternoon = afternoon;
      output.evening = evening;

      res.render('itinerary', output);
    }
  });
}
