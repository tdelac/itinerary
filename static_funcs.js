/**
 * File: static_funcs.js
 * Description: Misc functions to help with development. 
 */

module.exports = {
  array_deep_copy: function(input) {
    var output = [];

    for (var i = 0; i < input.length; ++i) {
      output[i] = input[i];
    }

    return output;
  },

  rand: function(scale) {
    return Math.floor(Math.random() * scale);
  },

  get_format_time: function(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var suffix = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' +minutes : minutes;
    return hours + ":" + minutes + ' ' + suffix;
  }
}
