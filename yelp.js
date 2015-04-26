exports.get_url = function(yelp, term, location, callback) {
  yelp.search({term: term, location: location, limit: 1}, function(err, data) {
    if (err) { console.log(err); }
    else {
      if (data) {
        if (data.businesses) {
          if (data.businesses[0]) {
            callback(data.businesses[0].url)
            return;
          }
          console.log("No businesses found!");
        }
        console.log("Businesses array corrupted!");
      }
      console.log("Data wasn't even returned...");
    }
  });
}

/* One of the worst things I've ever written */
exports.apify_set = function(set, api, city, callback) {
  var i = 0;

  var cb = function myself (url) {
    if (url) {
      set[i][5] = url;
    }
    i++;

    if (i < set.length) {
      exports.get_url(api, set[i][0], city, myself);
    } else {
      callback();
    }
  }

  if (i < set.length) {
    exports.get_url(api, set[i][0], city, cb);
  } else {
    callback();
  }
}

