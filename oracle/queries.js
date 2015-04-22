/**
 * File: queries.js
 * Description: A grouping of functions which return strings representing 
 * sql queries. Meant to abstract away from database layer
 */

module.exports = {
  get_city_coords: function(city_name) {
    return ("SELECT latitude, longitude "
            + "FROM CITY "
            + "WHERE CITY_NAME=" + city_name);
  },

  get_closest_business: function(latitude, longitude) {
    return ("WITH closest_business AS ( " 
            + "SELECT b.business_id, b.name, "
              + "(ACOS(SIN(3.14*b.latitude/180.0)*SIN(3.14*"+latitude+"/180.0)+" 
              + "COS(3.14*b.latitude/180.0)*COS(3.14*"+latitude+"/180.0)*"
              + "COS(3.14*"+longitude+"/180.0-3.14*b.longitude/180.0))) AS distance "
            + "FROM business b "
            + "ORDER BY distance asc) "
            + "SELECT name "
            + "FROM closest_business cb " // DONT FORGET THE GODDAMNED SPACES
            + "INNER JOIN landmark l on l.business_id = cb.business_id");
  },

  get_city_landmarks: function(city_name) {
    return ("SELECT * " 
            + "FROM landmark l "
              + "INNER JOIN business b "
              + "ON l.business_id = b.business_id "
            + "WHERE b.city = " + city_name);
  },

  get_city_restaurants: function(city_name) {
    return ("SELECT * " 
            + "FROM restaurant r "
              + "INNER JOIN business b "
              + "ON r.business_id = b.business_id "
            + "WHERE b.city = " + city_name);
  },

  get_landmark_by_stars: function(city_name, rows) {
    return (""
        
/*        
        
        "WITH business_review_filtered AS ( "
            + "SELECT b.name, b.stars, b.address "
            + "FROM business b "
              + "INNER JOIN business_review r "
              + "ON b.business_id = r.business_id "
        
          + "star_ordered AS ( "
            + "SELECT b.name, b.stars, b.address "
            + "FROM business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id "
            + "WHERE b.city = " + city_name
            + " ORDER BY (b.stars*b.review_count) DESC) "
          + "SELECT * " 
          + "FROM star_ordered "
          + "WHERE rownum <= " + rows*/);
  },
  
  get_landmark_by_utility: function(city_name, rows, t, b) {
    return ("WITH star_ordered AS ( "
            + "SELECT b.name, b.stars, b.address "
            + "FROM business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id "
            + "WHERE b.city = " + city_name
            + " ORDER BY (b.review_count * power(" + t + ",b.stars -" + b + ")) DESC) "
          + "SELECT * " 
          + "FROM star_ordered "
          + "WHERE rownum <= " + rows);
  }
  
  ,
  
  

  get_landmark_by_stars_weighted: function(city_name, rows) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address "
            + "FROM business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id "
            + "WHERE b.city = " + city_name + " "
            + "ORDER BY (b.review_count * b.stars) desc) "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows);
  }
}
