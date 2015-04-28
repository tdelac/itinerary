/**
 * File: static_funcs.js
 * Description: Misc functions to help with development. 
 */

var yelp = require("./yelp");

array_deep_copy = function(input) {
  var output = [];

  for (var i = 0; i < input.length; ++i) {
    output[i] = input[i];
  }

  return output;
}

rand = function(scale) {
  return Math.floor(Math.random() * scale);
}

get_formatted_time = function(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var suffix = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? '0' +minutes : minutes;
  return hours + ":" + minutes + ' ' + suffix;
}

format_time = function(businesses) {
  for (var i = 0; i < businesses.length; ++i) {
    var open = get_formatted_time(businesses[i][3]),
        close = get_formatted_time(businesses[i][4]);

    if (open === close) {
      businesses[i][3] = "Open 24 hours";
      businesses[i][4] = "";
    } else {
      businesses[i][3] = open;
      businesses[i][4] = close;
    }
  }
}

rand_unique_subset = function(set, result_size, to_compare) {
  var result = [];

  // Gross, but necessary
  for (var i = 0; i < set.length; ++i) {
    for (var j = 0; j < to_compare.length; ++j) {
      if (set[i][0] === to_compare[j][0]) {
        set[i] = null;
        break;
      }
    }
  }

  for (var i = 0; i < result_size; ++i) {
    var randomized = rand(set.length);

    while (set[randomized] == null) {
      randomized = rand(set.length); 
    }

    result[i] = set[randomized];
    set[randomized] = null;
  }

  return result
}

rand_unique_event = function(set, to_compare) {
  var morning = to_compare.morning,
      afternoon = to_compare.afternoon,
      evening = to_compare.evening,
      result;

  for (var i = 0; i < set.length; ++i) {
    for (var j = 0; j < morning.length; ++j) {
      if (set[i][0] === morning[j][0]) {
        set[i] = null;
        break;
      }
    }
    if (set[i] === null) continue;
    for (var j = 0; j < afternoon.length; ++j) {
      if (set[i][0] === afternoon[j][0]) {
        set[i] = null;
        break;
      }
    }
    if (set[i] === null) continue;
    for (var j = 0; j < evening.length; ++j) {
      if (set[i][0] === evening[j][0]) {
        set[i] = null;
        break;
      }
    }
  }

  while ((result = set[rand(set.length)]) == null) {}

  return result;
}

closest_unique_set = function(set, result_size, to_compare) {
  var result = [], 
      k = 0;

  // Gross, but necessary
  for (var i = 0; i < set.length; ++i) {
    for (var j = 0; j < to_compare.length; ++j) {
      if (set[i][0] === to_compare[j][0]) {
        set[i] = null;
        break;
      }
    }
  }

  for (var i = 0; i < result_size; ++i) {
    while (k < set.length && set[k] == null) {k++}
    result[i] = set[k];
    k++;
  }

  return result;
}

filter_xml = function(input) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

build_xml_event = function(event, open_tags, close_tags) {
  var xml = "";

  for(var i = 0; i < open_tags.length; ++i) {
    var element = filter_xml(String(event[i]));
    xml += (open_tags[i] + element + close_tags[i]);
  }

  return xml;
}

build_xml_events = function(events, open_tags, close_tags) {
  var xml = ""

  for (var i = 0; i < events.length; ++i) {
    xml += "<event>";
    xml += build_xml_event(events[i], open_tags, close_tags);
    xml += "</event>";
  }
  
  return xml
}

xml_of_itinerary = function(output) {
  var open_tags = [ "<name>", "<stars>", "<address>", "<open>", "<close>" 
                  , "<lat>", "<long>", "<url>" ];
  var close_tags = [ "</name>", "</stars>", "</address>", "</open>", "</close>" 
                   , "</lat>", "</long>", "</url>" ];

  var breakfast = build_xml_event(output.breakfast, open_tags, close_tags),
      lunch = build_xml_event(output.lunch, open_tags, close_tags),
      dinner = build_xml_event(output.dinner, open_tags, close_tags),
      morning = build_xml_events(output.morning, open_tags, close_tags),
      afternoon= build_xml_events(output.afternoon, open_tags, close_tags),
      evening = build_xml_events(output.evening, open_tags, close_tags);

  return (
    "<itinerary>"
      + "<breakfast>" + breakfast + "</breakfast>"
      + "<lunch>" + lunch + "</lunch>"
      + "<dinner>" + dinner + "</dinner>"
      + "<morning>" + morning + "</morning>"
      + "<afternoon>" + afternoon + "</afternoon>"
      + "<evening>" + evening + "</evening>" 
    + "</itinerary>"
  );
}

pretty_date = function(date) {
  var d = date.getDate();
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", 
      "Aug", "Sep", "Oct", "Nov", "Dec" ];
  var m = monthNames[date.getMonth()];
  var y = date.getFullYear();
  return d+' '+m+' '+y;
}

build_event = function(input) {
  var event = []

  event[0] = input.name;
  event[1] = input.stars;
  event[2] = input.address;
  event[3] = input.open;
  event[4] = input.close;
  event[5] = input.lat;
  event[6] = input.long;
  event[7] = input.url;

  return event;
}

build_events = function(input) {
  var result = [];

  if (input) {
    console.log(input);
    for (var i = 0; i < input.length; ++i) {
      result[i] = build_event(input[i]);
    }
  }
  return result;
}

module.exports = {
  array_deep_copy: array_deep_copy,
  rand: rand, 
  get_formatted_time: get_formatted_time, 
  format_time: format_time,
  rand_unique_subset: rand_unique_subset,
  rand_unique_event: rand_unique_event,
  closest_unique_set: closest_unique_set,
  xml_of_itinerary: xml_of_itinerary,
  pretty_date: pretty_date,
  build_event: build_event,
  build_events: build_events
}
