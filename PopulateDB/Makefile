all: scripts

run: scripts
	java -cp .:gson-2.3.1.jar:ojdbc7.jar LoadScript

scripts:
	javac -cp .:gson-2.3.1.jar:ojdcb7.jar LoadScript.java ConnectionDriver.java

clean:
	rm -rf *.class
