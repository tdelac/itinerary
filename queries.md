*User inputs location (in some way), number of landmarks to see, and click checkmarks for which meals.*


##Getting relevant tables:

with RTT as (
select table_name from dba_tables where owner=@NAME)
select column_name, table_name from all_tab_columns atc where exists (select * from RTT where atc.table_name = RTT.table_name)


#respose data:

TABLE_NAME
------------------------------
ITINERARY
BUSINESS
BUSINESS_REVIEW
BUSINESS_HOURS
LANDMARK
RESTAURANT
ITINERARY_BUSINESS
TEMP_BUSINESS
TEMP_BUSINESS_HOURS
TEMP_RESTAURANT
TEMP_LANDMARK

TABLE_NAME
------------------------------
TEMP_BUSINESS_REVIEW



COLUMN_NAME		       TABLE_NAME
------------------------------ ------------------------------
ITINERARY_ID		       ITINERARY
START_DATE		       ITINERARY
END_DATE		       ITINERARY
TOTAL_COST		       ITINERARY
BUSINESS_ID		       BUSINESS
LATITUDE		       BUSINESS
LONGITUDE		       BUSINESS
NAME			       BUSINESS
STARS			       BUSINESS
REVIEW_COUNT		       BUSINESS
REVIEW_ID		       BUSINESS_REVIEW

COLUMN_NAME		       TABLE_NAME
------------------------------ ------------------------------
STARS			       BUSINESS_REVIEW
REVIEW_DATE		       BUSINESS_REVIEW
VOTES			       BUSINESS_REVIEW
BUSINESS_ID		       BUSINESS_REVIEW
DAY			       BUSINESS_HOURS
OPEN			       BUSINESS_HOURS
CLOSE			       BUSINESS_HOURS
BUSINESS_ID		       BUSINESS_HOURS
BUSINESS_ID		       LANDMARK
CATEGORIES		       LANDMARK
BUSINESS_ID		       RESTAURANT

COLUMN_NAME		       TABLE_NAME
------------------------------ ------------------------------
BREAKFAST		       RESTAURANT
BRUNCH			       RESTAURANT
LUNCH			       RESTAURANT
DINNER			       RESTAURANT
DESSERT 		       RESTAURANT
LATENIGHT		       RESTAURANT
ITINERARY_ID		       ITINERARY_BUSINESS
BUSINESS_ID		       ITINERARY_BUSINESS
START_TIME		       ITINERARY_BUSINESS
END_TIME		       ITINERARY_BUSINESS
LONGITUDE		       TEMP_BUSINESS

COLUMN_NAME		       TABLE_NAME
------------------------------ ------------------------------
NAME			       TEMP_BUSINESS
STARS			       TEMP_BUSINESS
REVIEW_COUNT		       TEMP_BUSINESS
BUSINESS_ID		       TEMP_BUSINESS
LATITUDE		       TEMP_BUSINESS
REVIEW_ID		       TEMP_BUSINESS_REVIEW
STARS			       TEMP_BUSINESS_REVIEW
REVIEW_DATE		       TEMP_BUSINESS_REVIEW
USEFUL			       TEMP_BUSINESS_REVIEW
BUSINESS_ID		       TEMP_BUSINESS_REVIEW
BUSINESS_ID		       TEMP_RESTAURANT

COLUMN_NAME		       TABLE_NAME
------------------------------ ------------------------------
BREAKFAST		       TEMP_RESTAURANT
BRUNCH			       TEMP_RESTAURANT
LUNCH			       TEMP_RESTAURANT
DINNER			       TEMP_RESTAURANT
DESSERT 		       TEMP_RESTAURANT
LATENIGHT		       TEMP_RESTAURANT
DAY			       TEMP_BUSINESS_HOURS
OPEN			       TEMP_BUSINESS_HOURS
CLOSE			       TEMP_BUSINESS_HOURS
BUSINESS_ID		       TEMP_BUSINESS_HOURS
BUSINESS_ID		       TEMP_LANDMARK

COLUMN_NAME		       TABLE_NAME
------------------------------ ------------------------------
CATEGORIES		       TEMP_LANDMARK





##Possible input cities and (lat,long):
Las Vegas, NV           (36.169941,-115.139830)
Phoenix, AZ             (33.448377,-112.074037)
Madison, WI             (43.073052,-89.401230)
Urbana-Champaign, IL    (40.110588,-88.207270)
Charlotte, NC           (35.227087,-80.843127)
Pittsburgh, PA          (40.440625,-79.995886)
Waterloo, Canada        (43.464258,-80.520410)
Montreal, Canada        (45.501689,-73.567256)
Edinburgh, UK           (55.953252,-3.188267)
Karlsruhe, Germany      (49.006890,8.403653)



Either: we use the cities table or we take the user input and use an api to find the latitude and longitude


#####Case 1: We create a table for cities:

CREATE TABLE CITY
(CITYID integer,CITY_NAME varchar(255),latitude DECIMAL,longitude DECIMAL, PRIMARY KEY(CITYID));

Insertion example:
INSERT INTO CITY (CITYID,CITY_NAME,latitude,longitude)
VALUES (10,'Karlsruhe, Germany',49.006890,8.403653);


#####Case 2: We are given an input **@lat**,**@long**

distance between two (lat/long) points is:
ACOS(SIN(PI()*@lat1/180.0)*SIN(PI()*@lat2/180.0)+COS(PI()*@lat1/180.0)*COS(PI()*@lat2/180.0)*COS(PI()*@lon2/180.0-PI()*@lon1/180.0))*6371

for this example we use  (49.506890,8.008653)

##Rank businesses based on their closeness

with closest_business as (
select business_id, name, (ACOS(SIN(3.14*b.latitude/180.0)*SIN(3.14*49.506890/180.0)+COS(3.14*b.latitude/180.0)*COS(3.14*49.506890/180.0)*COS(3.14*b.longitude/180.0-3.14*8.008653/180.0))) as distance
from business b
order by distance asc)

Get closest meal (substitute specific **@Meal**)
select name
from closest_business
where **@Meal** = 1

Rank businesses based on their closeness
