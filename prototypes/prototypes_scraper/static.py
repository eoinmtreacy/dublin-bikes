import mysql.connector
import json
from constants import *

# Open the JSON file
with open('dublin.json', 'r') as file:
    # Load the JSON data into a dictionary
    data = json.load(file)

# Connect to your MySQL database
conn = mysql.connector.connect(
    host=DB,
    user=DB_USER,
    password=DB_PW,
    database=DB_NAME
)

# Create a cursor object
cursor = conn.cursor()

# Data to be inserted
data = open

# Insert data into the station table
for entry in data:
    cursor.execute("""
        INSERT INTO station (number, name, address, position_lat, position_lng)
        VALUES (%s, %s, %s, %s, %s)
    """, (entry["number"], entry["name"], entry["address"], entry["latitude"], entry["longitude"]))

# Commit changes
conn.commit()

# Close cursor and connection
cursor.close()
conn.close()

print("Data inserted successfully.")
