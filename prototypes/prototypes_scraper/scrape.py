import requests
import json
import mysql.connector
from constants import *

r = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={CITY}&apiKey={JCD_API_KEY}')

# parse json
data = json.loads(r.text)

# connect to database and create curson
conn = mysql.connector.connect(
    host=DB,
    user=DB_USER,
    password=DB_PW,
    database=DB_NAME
)

cursor = conn.cursor()

for station in data:
    number = station['number']
    available_bike_stands = station['available_bike_stands']
    available_bikes = station['available_bikes']
    last_update = station['last_update']

    # Execute INSERT query to add data to MySQL table
    cursor.execute("""
        INSERT INTO availability (number, available_bike_stands, available_bikes, last_update)
        VALUES (%s, %s, %s, %s)
    """, (number, available_bike_stands, available_bikes, last_update))

    conn.commit()

# Close cursor and connection
cursor.close()
conn.close()
