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
  }
}
