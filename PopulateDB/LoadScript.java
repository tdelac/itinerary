import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;

import java.io.BufferedReader;  
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader; 
import java.io.IOException;
import java.io.StringReader;


/*
COMPILE COMMAND:
javac -cp gson-2.3.1.jar LoadScript.java 

RUN COMMAND:
java -cp .:gson-2.3.1.jar LoadScript
*/



public class LoadScript {




	public static void main(String[] args) throws JsonSyntaxException, IOException {
		
		// db connection code here
		
		createTables();
		fillTables();

		
		
		// remember to close connection

	}


	public static void createTables() {
		
		
		return;
	}

	
	
	public static void fillTables() throws JsonSyntaxException, IOException {
		
		FileReader f_business = new FileReader("data/yelp_academic_dataset_business.json");
		FileReader f_review = new FileReader("data/yelp_academic_dataset_review.json");
		
		
		
		// ************ USE THIS CODE TO RUN ON ACTUAL FILE ************************************************ 
		
		//BufferedReader br_business = new BufferedReader(f_business);
		//BufferedReader br_review = new BufferedReader(f_review); 

		//*************************************************************************************************
		
		



		// ************* USE THIS CODE TO RUN ON TEST FILE WHICH IS FIRST TWO LINES OF REAL FILES **********
		
		BufferedReader br_temp_business = new BufferedReader(f_business);
		BufferedReader br_temp_review = new BufferedReader(f_review);
		BufferedReader br_business = new BufferedReader(new StringReader(br_temp_business.readLine() + "\n" + br_temp_business.readLine()));
		BufferedReader br_review = new BufferedReader(new StringReader(br_temp_review.readLine() + "\n" + br_temp_review.readLine()));
		
		//**************************************************************************************************
		
		
		//fills in review entity and review business relationship
		String line;
		while((line = br_review.readLine()) != null) {
			
			
			//parse through json and extract desired strings
			
			JsonElement jelement = new JsonParser().parse(line);
			
			JsonObject  review = jelement.getAsJsonObject();
			
			
			JsonObject votes = review.getAsJsonObject("votes");
			
			JsonElement funny = votes.get("funny");
			JsonElement useful = votes.get("useful");
			JsonElement cool = votes.get("cool");
			
			JsonElement review_id = review.get("review_id");
			
			JsonElement business_id = review.get("business_id");
			
			JsonElement stars = review.get("stars");
			
			JsonElement date = review.get("date");


			//create insert statement strings
			String review_insert = "insert into review values " + review_id.toString() + ", " + funny.toString() + ", "  + useful.toString() + ", "  + cool.toString() + ", "  + stars.toString() + ", " + date.toString();
			String review_rel_insert = "insert into review_business values" + ", "  + review_id.toString() + ", "  + business_id.toString();
			
			
			
			//REPLACE THESE PRINTS WITH METHOD TO ACTUALLY EXECUTABLE INSERTION STATEMENTS
			
			//insert into review entity
			System.out.println(review_insert); 
			
			//insert into review-business relationship
			System.out.println(review_rel_insert);
			
			
			
			
			
			
		}
		
		
		
		






















	}

}
