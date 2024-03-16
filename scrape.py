import requests
import json
import mysql.connector
import time
import sys
from datetime import datetime
from constants import *

def main(arg):
    r = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={arg}&apiKey={JCD_API_KEY}')
    if r.status_code != 200:
        print("Error with request to JCDecaux API: check your city name and API key")
        return

    # parse json
    data = json.loads(r.text)

    # connect to database and create curson
    conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW,
        database=arg
    )

    cursor = conn.cursor()

    # pull weather api 

    for station in data:
        # get relevant chunks
        try: 
            number = station['number']
            available_bike_stands = station['available_bike_stands']
            available_bikes = station['available_bikes']
            last_update = station['last_update'] / 1000 # convert from milliseconds to unix time

            # insert each station's data
            cursor.execute("""
                INSERT INTO availability (number, available_bike_stands, available_bikes, last_update)
                VALUES (%s, %s, %s, %s)
            """, (number, available_bike_stands, available_bikes, last_update)) # temp, precipitation, wind sppeed 

            conn.commit()
        except:
            print(f"Duplicate data, station number: {number} @ {datetime.fromtimestamp(last_update)}, not adding")

    # Close cursor and connection
    cursor.close()
    conn.close()

    print(f'Last update: {datetime.fromtimestamp(last_update)}')

if __name__ == "__main__":
    # Check if there is exactly one command-line argument (excluding the script name)
    if len(sys.argv) != 2:
        print("Usage: python scrape.py <city_name>")
        sys.exit(1)

    else:
        # Extract the argument
        arg = sys.argv[1]
        main(arg)