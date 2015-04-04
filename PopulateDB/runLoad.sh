#!/bin/bash

for i in `seq 14 65`
do
  echo $i
  a=$(( i*1000 ))
  java -cp .:gson-2.3.1.jar:ojdbc7.jar LoadScript $a
done
