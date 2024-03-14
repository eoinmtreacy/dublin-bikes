import requests
import json
import sys
import mysql.connector
from constants import *

def fetch_city_static(arg: str) -> bool:
        try:
            r = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={arg}&apiKey={JCD_API_KEY}')
            # parse json
            data = json.loads(r.text)
            print(data)

            with open(f"./stations/{arg}_stations.json", "w") as json_file:
                json_file.write(json.dumps(data, indent=4))
            return True
        except:
            return False

def create_stations_db(arg, cursor):
    query = f"CREATE DATABASE IF NOT EXISTS {arg};"
    try:
        cursor.execute(query)
        return True
    except:
         return False
        

if __name__ == "__main__":
    # Check if there is exactly one command-line argument (excluding the script name)
    if len(sys.argv) != 2:
        print("Usage: python static_create.py <city_name>")
        sys.exit(1)

    # Extract the argument
    arg = sys.argv[1]

    # Process the argument
    if not fetch_city_static(arg):
         print("Error fetching contract city stations file")
         print("Error with request to JCDecaux API: check your contract name and API key")

    conn = mysql.connector.connect(host=DB,
                                   user=DB_USER,
                                   password=DB_PW
                                   )
    
    cursor = conn.cursor()

    if not create_stations_db(arg, cursor):
         print("Error creating database")