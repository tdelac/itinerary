# Itinerary 

### Project Description
A simple application, powered by the Yelp Dataset, which allows a user to 
generate easy, fun, and unique itineraries when visiting cities across the 
United States. 

### Project Layout
#### PopulateDB
Stores programs (java) for parsing Yelp data and uploading to a database 
according to the schema used by the itinerary app.

### Project Setup
#### Populating the Database
Assumes Oracle SQL database.
cd into the PopulateDB directory. Make sure you have a good internet connection 
before continuing. Run <make run>. That's it! NOTE: Make sure that you have a 
file called "login.txt" at the same directory level as PopulateDB. This file 
should include the login credentials for your database. The format of this 
file is as follows:

URL: <string url to oracle database>
USER: <string user name>
PASS: <string passwork>
