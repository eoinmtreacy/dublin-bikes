import requests
import json
import mysql.connector
import time
from datetime import datetime
from constants import *

def main():
    while True:
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
                print("Duplicate data, not adding")

        # Close cursor and connection
        cursor.close()
        conn.close()

        print(f'Last update: {datetime.fromtimestamp(last_update)}')

        time.sleep(300)

main()