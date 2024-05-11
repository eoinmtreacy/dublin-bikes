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
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {arg.replace('-','')};")
        return True
    except mysql.connector.Error as e:
        print(e)
        return False
        
def create_stations_table(conn, cursor) -> bool:
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
        conn.commit()
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
    
def create_weather_table(conn, cursor):
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weather (
                last_update BIGINT PRIMARY KEY,
                temp_c FLOAT,
                temp_f FLOAT,
                is_day FLOAT,
                wind_mph FLOAT,
                wind_kph FLOAT,
                wind_degree FLOAT,
                wind_dir CHAR(10),
                pressure_mb FLOAT,
                pressure_in FLOAT,
                precip_mm FLOAT,
                precip_in FLOAT,
                humidity FLOAT,              
                cloud FLOAT,                
                feelslike_c FLOAT,
                feelslike_f FLOAT,
                vis_km FLOAT,
                vis_miles FLOAT,
                uv FLOAT,
                gust_mph FLOAT,
                gust_kph FLOAT
        )
    """)
        conn.commit()
        return True
        
    except mysql.connector.Error as e:
        print(e)
        return False
    
def main():
    with open("contracts.txt", "r") as contracts:
        for contract in contracts.readlines():
            arg = contract[:-1]
            if fetch_city_static(arg):
                print(f"static data saved in stations/{arg}_stations.json")
                conn = mysql.connector.connect(
                        host=HOST,
                        port=PORT,
                        user=DB_USER,
                        password=DB_PW,
                )
                cursor = conn.cursor()

                if create_stations_db(cursor, arg):
                    print(f"Creating/found database {arg}")
                    conn.close()
                    cursor.close()

                    # create new connection and cursor to database: arg
                    conn = mysql.connector.connect(
                        host=HOST,
                        port=PORT,
                        user=DB_USER,
                        password=DB_PW,
                        database=arg
                    )
                    cursor = conn.cursor()
                    if create_stations_table(conn, cursor):
                        print(f"created stations table in database {arg}")
                        if populate_stations_table(conn, cursor, arg):
                            print(f"stations table in  database {arg} succesfully populated")
                            if create_availability_table(conn, cursor):
                                print(f"availability table created in database {arg}")
                                if create_weather_table(conn, cursor):
                                    print(f"weathe table succesfully created for database {arg}")

                conn.close()
                cursor.close()

            else:
                print(f"Error fetching contract city {arg} stations file")
                print(f"Error with request to JCDecaux API: check your contract name '{arg}' or API key")


if __name__ == "__main__":
    # Check if there is exactly one command-line argument (excluding the script name)
    main()