#!/bin/bash

# init postgres
sudo postgresql-setup initdb

# start postgres
sudo systemctl start postgresql

# enable postgres
sudo systemctl enable postgresql

# create a user: recommend to call it 'opc' with pw 'test' because queries.js uses 'opc'as user
sudo -u postgres createuser --interactive -P

# create a database called 'api': recommended becasue querires.js uses 'api' as database
sudo -u postgres createdb api
 
###################################################
#    Bash Shell script to execute psql command    # 
###################################################
 
#Set the value of variable
database="api"
username="opc"
 
#Execute few psql commands: 
#Note: you can also add -h hostname -U username in the below commands. 
# psql -d $database -U $username -c "\password" 
psql -d $database -h localhost -U $username -c "CREATE TABLE users (ID SERIAL PRIMARY KEY, name VARCHAR(30), email VARCHAR(30));"
psql -d $database -h localhost -U $username -c "INSERT INTO users (name, email) VALUES ('Jerry', 'jerry@example.com'), ('George', 'george@example.com');"
psql -d $database -h localhost -U $username -c "SELECT * FROM users"
 
#Assign table count to variable
TableCount=$(psql -d $database -h localhost -U $username -t -c "select count(1) from users")
 
#Print the value of variable
echo "Total table records count....:"$TableCount
