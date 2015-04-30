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
        
          + "star_ORdered AS ( "
            + "SELECT b.name, b.stars, b.address "
            + "FROM business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id "
            + "WHERE b.city = " + city_name
            + " ORDER BY (b.stars*b.review_count) DESC) "
          + "SELECT * " 
          + "FROM star_ORdered "
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
  },

  get_landmark_by_stars_weighted: function(city_name, day, rows) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close "
            + "FROM (business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE b.city = " + city_name + " AND bh.day = " + day + " "
            + "ORDER BY (b.review_count * b.stars) desc) "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows);
  },

  /* Note: landmarks do not include 24hr establishments. Issues? */
  get_morning_landmark_by_stars_dist_weighted: function(city_name, day, rows, lat, long) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close, b.latitude, b.longitude "
            + "FROM (business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE b.city = " + city_name + " AND bh.day = " + day + "AND "
              + "extract(hour from bh.close) > 9 AND extract(hour from bh.open) < 13 "
            + "ORDER BY (b.review_count * b.stars) desc), "
          + "review_ordered AS ( "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows + ") "
            + "SELECT ro.name, ro.stars, ro.address, ro.open, ro.close, ro.latitude, ro.longitude " 
            + "FROM review_ordered ro "
            + "ORDER BY (ACOS(SIN(3.14*ro.latitude/180.0)*SIN(3.14*"+lat+"/180.0)+" 
              + "COS(3.14*ro.latitude/180.0)*COS(3.14*"+lat+"/180.0)*"
              + "COS(3.14*"+long+"/180.0-3.14*ro.longitude/180.0))) ASC");
  },

  get_afternoon_landmark_by_stars_dist_weighted: function(city_name, day, rows, lat, long) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close, b.latitude, b.longitude "
            + "FROM (business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE b.city = " + city_name + " AND bh.day = " + day + "AND "
              + "extract(hour from bh.close) > 12 AND extract(hour from bh.open) < 19 "
            + "ORDER BY (b.review_count * b.stars) desc), "
          + "review_ordered AS ( "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows + ") "
            + "SELECT ro.name, ro.stars, ro.address, ro.open, ro.close, ro.latitude, ro.longitude " 
            + "FROM review_ordered ro "
            + "ORDER BY (ACOS(SIN(3.14*ro.latitude/180.0)*SIN(3.14*"+lat+"/180.0)+" 
              + "COS(3.14*ro.latitude/180.0)*COS(3.14*"+lat+"/180.0)*"
              + "COS(3.14*"+long+"/180.0-3.14*ro.longitude/180.0))) ASC");
  },

  get_evening_landmark_by_stars_dist_weighted: function(city_name, day, rows, lat, long) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close, b.latitude, b.longitude "
            + "FROM (business b "
              + "INNER JOIN landmark l "
              + "ON b.business_id = l.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE b.city = " + city_name + " AND bh.day = " + day + "AND "
              + "(extract(hour from bh.close) > 20 OR extract(hour from bh.close) < 7) AND "
              + "(extract(hour from bh.open) < 23 OR extract(hour from bh.open) < 2) "
            + "ORDER BY (b.review_count * b.stars) desc), "
          + "review_ordered AS ( "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows + ") "
            + "SELECT ro.name, ro.stars, ro.address, ro.open, ro.close, ro.latitude, ro.longitude " 
            + "FROM review_ordered ro "
            + "ORDER BY (ACOS(SIN(3.14*ro.latitude/180.0)*SIN(3.14*"+lat+"/180.0)+" 
              + "COS(3.14*ro.latitude/180.0)*COS(3.14*"+lat+"/180.0)*"
              + "COS(3.14*"+long+"/180.0-3.14*ro.longitude/180.0))) ASC");
  },

  get_breakfast_by_stars_weighted: function(city_name, day, rows) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close, b.latitude, b.longitude "
            + "FROM (business b "
              + "INNER JOIN restaurant r "
              + "ON b.business_id = r.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE bh.day = " + day + " AND b.city = " + city_name 
              + " AND ((extract(hour from bh.open) < 10 AND extract(hour from bh.close) > 12) OR " 
              + "extract(hour from bh.open) = extract(hour from bh.close)) AND "
              + "(r.breakfast = 1 OR r.brunch = 1 OR "
              + "(r.breakfast = 0 AND r.brunch = 0 AND r.lunch = 0 AND r.dinner = 0 AND r.dessert = 0 AND r.latenight = 0)) "
            + "ORDER BY (b.review_count * b.stars) desc) "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows);
  },

  get_lunch_by_stars_weighted: function(city_name, day, rows) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close, b.latitude, b.longitude "
            + "FROM (business b "
              + "INNER JOIN restaurant r "
              + "ON b.business_id = r.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE bh.day = " + day + " AND b.city = " + city_name 
              + " AND ((extract(hour from bh.open) < 12 AND extract(hour from bh.close) > 16) OR "
              + "extract(hour from bh.open) = extract(hour from bh.close)) AND "
              + "(r.brunch = 1 OR r.lunch = 1 OR "
              + "(r.breakfast = 0 AND r.brunch = 0 AND r.lunch = 0 AND r.dinner = 0 AND r.dessert = 0 AND r.latenight = 0)) "
            + "ORDER BY (b.review_count * b.stars) desc) "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows);
  },

  get_dinner_by_stars_weighted: function(city_name, day, rows) {
    return ("WITH weighted_stars AS ( "
            + "SELECT b.name, b.stars, b.address, bh.open, bh.close, b.latitude, b.longitude "
            + "FROM (business b "
              + "INNER JOIN restaurant r "
              + "ON b.business_id = r.business_id) "
              + "INNER JOIN business_hours bh "
              + "ON b.business_id = bh.business_id "
            + "WHERE bh.day = " + day + " AND b.city = " + city_name 
              + " AND ((extract(hour from bh.open) < 17 AND extract(hour from bh.close) > 20) OR "
              + "extract(hour from bh.open) = extract(hour from bh.close)) AND "
              + "(r.dinner = 1 OR r.latenight = 1 OR "
              + "(r.breakfast = 0 AND r.brunch = 0 AND r.lunch = 0 AND r.dinner = 0 AND r.dessert = 0 AND r.latenight = 0)) "
            + "ORDER BY (b.review_count * b.stars) desc) "
            + "SELECT * FROM weighted_stars "
            + "WHERE rownum <= " + rows);
  },

  insert_new_itinerary: function(user_id, city, date, itinerary_xml) {
    var out = ( "INSERT INTO itinerary "
            + "VALUES( "
              + "'" + user_id + "'" + ", "
              + "itinerary_sequence.nextval, "
              + "'" + city + "', "
              + "TO_DATE(" + "'" + date + "', 'yyyy/mm/dd'), "
              + "SYS.XMLType.CreateXML('" + itinerary_xml + "'))");
    return out;
  },

  get_itineraries_given_user: function(user_id) {
    return ("SELECT itinerary_id, city, itinerary_date "
            + "FROM itinerary "
            + "WHERE user_id = " + user_id 
            + " ORDER BY itinerary_date DESC");
  },

  get_itinerary: function(user_id, itinerary_id) {
    return ("SELECT itinerary_date, city, SYS.XMLType.getStringVal(itinerary_data) AS xml "
            + "FROM itinerary "
            + "WHERE user_id = " + user_id + " AND itinerary_id = " + itinerary_id);
  }
}
