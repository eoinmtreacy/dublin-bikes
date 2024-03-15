import requests
import json
import sys
import mysql.connector
from constants import *

def fetch_city_static(arg: str) -> bool:
        try:
            r: requests.Response = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={arg}&apiKey={JCD_API_KEY}')

            if r.status_code != 200:
                print(f"Error fetching static data for {arg}, are you sure it is a valid contract name?")
                return False

            data = json.loads(r.text)

            with open(f"./stations/{arg}_stations.json", "w") as json_file:
                json_file.write(json.dumps(data, indent=4))
            return True
        except:
            return False

def create_stations_db(cursor, arg) -> bool:
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {arg};")
        return True
    except mysql.connector.Error as e:
        print(e)
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
            number INTEGER PRIMARY KEY,
            position_lat REAL,
            position_lng REAL,
            status VARCHAR(256)
            )
            """
        
        cursor.execute(sql)
        return True
    except mysql.connector.Error as e:
        print(e)
        return False
    
def populate_stations_table(conn, cursor, arg) -> bool:
    try:
        with open(f"./stations/{arg}_stations.json", "r") as json_file:
            data = json.load(json_file)
        for entry in data:
            try:
                cursor.execute("""
                            INSERT INTO stations (address, banking, bike_stands, bonus, contract_name, 
                            name, number, position_lat, position_lng, status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, 
                            (entry["address"], entry["banking"], entry["bike_stands"], entry["bonus"], entry["contract_name"],
                                entry["name"], entry["number"], entry["position"]["lat"], entry["position"]["lng"], entry["status"]))
            except mysql.connector.Error as e:
                print(e)

        conn.commit()
        return True
    except mysql.connector.Error as e:
        print(e)
        return False
    
def create_availability_table(conn, cursor):
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS availability (
            number INTEGER,
            available_bikes INTEGER,
            available_bike_stands INTEGER,
            last_update BIGINT,
            PRIMARY KEY (number, last_update)
        )
        """)
        conn.commit()
        return True
    except mysql.connector.Error as e:
        print(e)
        return False
    
def main(arg):
    if fetch_city_static(arg):
        print(f"static data saved in stations/{arg})station.json")
        conn = mysql.connector.connect(host=DB,
                                    user=DB_USER,
                                    password=DB_PW
                                    )
        cursor = conn.cursor()

        if create_stations_db(cursor, arg):
            print(f"Creating/found database {arg}")
            conn.close()
            cursor.close()

            # create new connection and cursor to database: arg
            conn = mysql.connector.connect(host=DB,
                                        user=DB_USER,
                                        password=DB_PW,
                                        database=arg)
            cursor = conn.cursor()
            if create_stations_table(conn, cursor):
                print(f"created stations table in database {arg}")
                if populate_stations_table(conn, cursor, arg):
                    print(f"stations table in  database {arg} succesfully populated")
                    if create_availability_table(conn, cursor):
                        print(f"availability table created in database {arg}")

        conn.close()
        cursor.close()

    else:
         print("Error fetching contract city stations file")
         print("Error with request to JCDecaux API: check your contract name and API key")


if __name__ == "__main__":
    # Check if there is exactly one command-line argument (excluding the script name)
    if len(sys.argv) != 2:
        print("Usage: python static_create.py <city_name>")
        sys.exit(1)

    else:
        # Extract the argument
        arg = sys.argv[1]
        main(arg)