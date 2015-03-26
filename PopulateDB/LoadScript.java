import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSyntaxException;

import java.io.BufferedReader;  
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader; 
import java.io.IOException;
import java.io.StringReader;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;


/*
COMPILE COMMAND:
javac -cp gson-2.3.1.jar LoadScript.java 

RUN COMMAND:
java -cp .:gson-2.3.1.jar LoadScript
 */



public class LoadScript {

  private static ConnectionDriver dbConnect = null;


	public static void main(String[] args) throws JsonSyntaxException, IOException {
		
		//dbConnect = new ConnectionDriver();
		
		//createTables();
		fillTables();

	  //dbConnect.close();	
	}


	public static void createTables() {

		List<String> createQueries = new ArrayList<String>();
		
		/* itinerary table */
		createQueries.add(
		    "CREATE TABLE Itinerary ("
		    + "itinerary_id INTEGER PRIMARY KEY,"
		    + "start_date DATE,"
		    + "end_date DATE,"
		    + "total_cost INTEGER)");

    /* Business table */
		createQueries.add(
		    "CREATE TABLE Business ("
		    + "business_id VARCHAR(22) PRIMARY KEY,"
		    + "latitude DECIMAL,"
		    + "longitude DECIMAL,"
		    + "name VARCHAR(30),"
		    + "stars DECIMAL,"
		    + "review_count INTEGER)");

		 /* business_review table */
		 createQueries.add(
		    "CREATE TABLE business_review ("
		    + "review_id VARCHAR(22),"
		    + "stars INTEGER,"
		    + "review_date DATE,"
		    + "votes INTEGER,"
		    + "business_id VARCHAR(22),"
		    + "PRIMARY KEY (review_id, business_id),"
		    + "FOREIGN KEY (business_id) REFERENCES Business(business_id) ON DELETE CASCADE)");

		 /* business_hours table */
		 createQueries.add(
		    "CREATE TABLE Business_hours ("
		    + "day CHAR(2),"
		    + "open TIMESTAMP,"
		    + "close TIMESTAMP,"
		    + "business_id VARCHAR(22),"
		    + "PRIMARY KEY (business_id, day),"
		    + "FOREIGN KEY (business_id) REFERENCES Business(business_id) ON DELETE CASCADE)");

		 /* Landmark table */
     createQueries.add(
        "CREATE TABLE Landmark ("
        + "business_id VARCHAR(22) PRIMARY KEY,"
        + "categories VARCHAR(50),"
        + "FOREIGN KEY (business_id) REFERENCES Business(business_id) ON DELETE CASCADE)");

     /* Restaurant tabe */
     createQueries.add(
        "CREATE TABLE Restaurant ("
        + "business_id VARCHAR(22) PRIMARY KEY,"
        + "breakfast NUMBER(1),"
        + "brunch NUMBER(1),"
        + "lunch NUMBER(1),"
        + "dinner NUMBER(1),"
        + "dessert NUMBER(1),"
        + "latenight NUMBER(1),"
        + "FOREIGN KEY (business_id) REFERENCES Business(business_id) ON DELETE CASCADE)");

     /* itinerary_business table */
     createQueries.add(
        "CREATE TABLE Itinerary_business ("
        + "itinerary_id INTEGER,"
        + "business_id VARCHAR(22),"
        + "start_time TIMESTAMP,"
        + "end_time TIMESTAMP,"
        + "PRIMARY KEY (itinerary_id, business_id),"
        + "FOREIGN KEY (itinerary_id) REFERENCES Itinerary(itinerary_id),"
        + "FOREIGN KEY (business_id) REFERENCES Business(business_id))");

     /* Run all create queries */
     dbConnect.executeCreate(createQueries);
	}



	public static void fillTables() throws JsonSyntaxException, IOException {

		//String data_path = new java.io.File( "../data" ).getCanonicalPath();
		String data_path = new java.io.File( "./data" ).getCanonicalPath();


		FileReader f_business = new FileReader(data_path + "/yelp_academic_dataset_business.json");
		FileReader f_review = new FileReader(data_path + "/yelp_academic_dataset_review.json");



		// ************ USE THIS CODE TO RUN ON ACTUAL FILE ************************************************ 

		//BufferedReader br_business = new BufferedReader(f_business);
		//BufferedReader br_review = new BufferedReader(f_review); 

		//*************************************************************************************************





		// ************* USE THIS CODE TO RUN ON TEST FILE WHICH IS FIRST TWO LINES OF REAL FILES **********
		final int NUM_ENTRIES = 2;

		BufferedReader br_temp_business = new BufferedReader(f_business);
		BufferedReader br_temp_review = new BufferedReader(f_review);

		String s_business = "";
		String s_review = "";
		for(int i = 0; i < NUM_ENTRIES; i++) {
			s_business+=br_temp_business.readLine() + "\n";
			s_review+=br_temp_review.readLine() + "\n";
		}


		BufferedReader br_business = new BufferedReader(new StringReader(s_business));
		BufferedReader br_review = new BufferedReader(new StringReader(s_review));

		//**************************************************************************************************



		String line;

		System.out.println();
		System.out.println("FILLING IN BUSINESS, RESTAURANT, LANDMARK AND BUSINESS_HOURS TABLES...");


		//fills in rest of tables
		
		while((line = br_business.readLine()) != null) {

			JsonElement jelement = new JsonParser().parse(line);


			JsonObject business = jelement.getAsJsonObject();

			//remember to remove this print when running it for real
			System.out.println();
			//System.out.println(business);

			JsonElement business_id = business.get("business_id");
			JsonElement latitude = business.get("latitude");
			JsonElement longitude = business.get("longitude");
			JsonElement name = business.get("name");
			JsonElement stars = business.get("stars");
			JsonElement review_count = business.get("review_count");
			JsonArray categories = business.get("categories").getAsJsonArray();
			
			String business_insert = 
			    "insert into Business values (" 
			  + business_id.toString().replaceAll("\"", "'") + ", " 
			  + latitude.toString().replaceAll("\"", "'") + ", " 
			  + longitude.toString().replaceAll("\"", "'")  + ", " 
			  + name.toString().replaceAll("\"", "'")  + ", " 
			  + stars.toString().replaceAll("\"", "'")  + ", " 
			  + review_count.toString().replaceAll("\"", "'")  + ")";
			
			System.out.println(business_insert);
			
			String type = "Landmark";


			String business_type_insert = "";
			
			//code to fill in restaurant table as well as specify type for business table
			if(categories.contains(new JsonPrimitive("Restaurants"))) {

				HashMap<String,String> meals = new HashMap<String, String>();

				meals.put("dessert", "FALSE");
				meals.put("latenight", "FALSE");
				meals.put("lunch", "FALSE");
				meals.put("dinner", "FALSE");
				meals.put("breakfast", "FALSE");
				meals.put("brunch", "FALSE");


				//if attributes has a "good for" key (which is almost always does), iterate through the good for json and fill in the hash map accordingly

				JsonObject attributes =  business.get("attributes").getAsJsonObject();
				if(attributes.has("Good For")) {
					JsonObject goodFor = attributes.get("Good For").getAsJsonObject();
					Set<Map.Entry<String,JsonElement>> map_set = goodFor.entrySet();
					for(Map.Entry<String,JsonElement> m : map_set) {
						if(m.getValue().toString().replaceAll("\"", "'").equals("true"))
							meals.put(m.getKey(), "TRUE");		
					}
				}



				type = "Restaurants";
				
				String restaurant_insert = 
				    "insert into Restaurant values (" 
				  + business_id.toString().replaceAll("\"", "'") + ", " 
				  + meals.get("breakfast") + ", " 
				  + meals.get("brunch") + ", " 
				  + meals.get("lunch") + ", " 
				  + meals.get("dinner") + ", " 
				  + meals.get("dessert") + ", " 
				  + meals.get("latenight") + ")";
				
				//*************REPLACE THIS PRINT STATEMENT WITH ACTUAL SQL STATEMENT EXECUTION*****************
				
				System.out.println(restaurant_insert);
				
				

			}
			else {

				//concatenate all categories of a landmark into a single string separated by a *
				String landmark_categories = "";
				for(JsonElement j : categories) {
					String j_str = j.toString().replaceAll("\"", "'");
					landmark_categories += j_str.substring(1,j_str.length() - 1) + "*";
				}

				landmark_categories = "\"" + landmark_categories + "\"";
				
				String landmark_insert = 
				    "insert into Landmark values (" 
				  + business_id.toString().replaceAll("\"", "'") + ", " 
				  + landmark_categories + ")";
				
				//*************REPLACE THIS PRINT STATEMENT WITH ACTUAL SQL STATEMENT EXECUTION*****************
				
				System.out.println(landmark_insert);
				


			}



			//*************REPLACE THIS PRINT STATEMENT WITH ACTUAL SQL STATEMENT EXECUTION*****************

			

			


			//fill in hours table
			JsonObject hours = business.get("hours").getAsJsonObject();
			
			//if the hours value is not the empty list..."{}". Wonder if there's a better way to do this check..
			if(hours.toString().replaceAll("\"", "'").length() != 2) {
				Set<Map.Entry<String,JsonElement>> map_set = hours.entrySet();

				for(Map.Entry<String,JsonElement> m : map_set) {
					String weekday_abbrev = "";
					if(m.getKey().toString().replaceAll("\"", "'").equals("Monday")) {
						weekday_abbrev = "M";
					}
					else if(m.getKey().toString().replaceAll("\"", "'").equals("Tuesday")) {
						weekday_abbrev = "Tu";
					}
					else if(m.getKey().toString().replaceAll("\"", "'").equals("Wednesday")) {
						weekday_abbrev = "W";
					}
					else if(m.getKey().toString().replaceAll("\"", "'").equals("Thursday")) {
						weekday_abbrev = "Th";
					}
					else if(m.getKey().toString().replaceAll("\"", "'").equals("Friday")) {
						weekday_abbrev = "F";
					}
					else if(m.getKey().toString().replaceAll("\"", "'").equals("Saturday")) {
						weekday_abbrev = "Sa";
					}
					else {
						weekday_abbrev = "Su";
					}




					JsonObject day = m.getValue().getAsJsonObject();
					JsonObject open_close = m.getValue().getAsJsonObject();

					String open = open_close.get("open").toString().replaceAll("\"", "'");
					String close = open_close.get("close").toString().replaceAll("\"", "'");
					
					String hours_insert = 
					    "insert into Business_hours values (\"" 
					  + weekday_abbrev + "\", TIMESTAMP_TO(" 
					  + open + ", HH24:MI), TIMESTAMP_TO(" 
					  + close + ", HH24:MI), " 
					  + business_id.toString().replaceAll("\"", "'") + ")";



					//*************REPLACE THIS PRINT STATEMENT WITH ACTUAL SQL STATEMENT EXECUTION*****************

					System.out.println(hours_insert);
				}


			}



			/*
			DDL CHANGES:
			votes becomes useful
			INCLUDE review_count in business table
			restaurant has breakfast brunch lunch dinner dessert late_night boolean attributes
			landmark has category attribute which is a string of categories ex: "Nightlife*Comedy Clubs"...VARCHAR(50) should be good enough
			timestamp not time

			 */

			//ALSO GOTTA FIGURE OUT IF INSERT STIRNGS SHOULD HAVE SEMICOLON AT END OR NOT


		}
		
		
		
		
		System.out.println();
		System.out.println("FILLING IN REVIEW TABLE...");
		


		//fills in review entity

		while((line = br_review.readLine()) != null) {


			//parse through json and extract desired strings

			JsonElement jelement = new JsonParser().parse(line);

			JsonObject review = jelement.getAsJsonObject();
			System.out.println();
			//System.out.println(review);

			JsonObject votes = review.getAsJsonObject("votes");


			JsonElement useful = votes.get("useful");


			JsonElement review_id = review.get("review_id");

			JsonElement business_id = review.get("business_id");

			JsonElement stars = review.get("stars");

			JsonElement date = review.get("date");


    	String review_insert = 
			    "insert into business_review values " 
			  + review_id.toString().replaceAll("\"", "'") + ", "  
			  + stars.toString().replaceAll("\"", "'") + ", "  
			  + date.toString().replaceAll("\"", "'") + ", " 
			  + useful.toString().replaceAll("\"", "'") + ", " 
			  + business_id.toString().replaceAll("\"", "'") + ")";



			//*************REPLACE THIS PRINT STATEMENT WITH ACTUAL SQL STATEMENT EXECUTION*****************

			//insert into review entity
			System.out.println(review_insert); 



		}

	}

}
