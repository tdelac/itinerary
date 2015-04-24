/**
 * File: static_funcs.js
 * Description: Misc functions to help with development. 
 */

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

module.exports = {
  array_deep_copy: array_deep_copy,
  rand: rand, 
  get_formatted_time: get_formatted_time, 
  format_time: format_time
}
