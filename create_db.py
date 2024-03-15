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

            with open(f"./stations/{arg}_stations.json", "w") as json_file:
                json_file.write(json.dumps(data, indent=4))
            return True
        except:
            return False

def create_stations_db(arg: str, cursor: str) -> bool:
    query: str = f"CREATE DATABASE IF NOT EXISTS {arg};"
    try:
        cursor.execute(query)
        return True
    except:
         return False
        
def create_stations_table(cursor) -> bool:
    try:
        sql = """
            CREATE TABLE IF NOT EXISTS stations (
            address VARCHAR(256),
            banking INTEGER,
            bike_stands INTEGER,
            bonus INTEGER,
            contract_name VARCHAR(256),
            name VARCHAR(256),
            number INTEGER,
            position_lat REAL,
            position_lng REAL,
            status VARCHAR(256)
            )
            """
        
        cursor.execute(sql)
        return True
    except:
        return False
    
def populate_stations_table(cursor, arg) -> bool:
    try:
        with open(f"./stations/{arg}_stations.json", "r") as json_file:
            data = json.load(json_file)
        for entry in data:
            cursor.execute("""
                           INSERT INTO stations (address, banking, bike_stands, bonus, contract_name, 
                           name, number, position_lat, position_lng, status)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           """, 
                           (entry["address"], entry["banking"], entry["bike_stands"], entry["bonus"], entry["contract_name"],
                            entry["name"], entry["number"], entry["position"]["lat"], entry["position"]["lng"], entry["status"]))
        return True
    except mysql.connector.Error as e:
        print(e)
        return False
    
def show_stations(cursor) -> bool:
    try:
        res = cursor.execute("SHOW * FROM stations;")
        print(res.fetchall())
        return True
    except mysql.connector.Error as e:
        print(e)
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
    else:
        print("static file fetched")

    conn = mysql.connector.connect(host=DB,
                                   user=DB_USER,
                                   password=DB_PW
                                   )
    
    cursor = conn.cursor()

    if not create_stations_db(arg, cursor):
         print("Error creating database")
    else:
        print(f"found database {arg}")

    conn.close()
    cursor.close()

    # connect to database: arg
    conn = mysql.connector.connect(host=DB,
                                   user=DB_USER,
                                   password=DB_PW,
                                   database=arg)
    cursor = conn.cursor()

    if not create_stations_table(cursor):
        print(f"Error creating stations table in database: {arg}")
    else:
        print(f"made stations table for {arg}")

    if not populate_stations_table(cursor, arg):
        print(f"Error populating stations table in databse: {arg}")
    else:
        print("succesfully added stations to table")

    if not show_stations(cursor):
        print("error finding stations in table")

    cursor.close()
    conn.close()