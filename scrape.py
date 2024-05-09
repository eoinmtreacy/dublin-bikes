import requests
import json
import pymysql
import time
import sys
from datetime import datetime
from constants import *


def main(arg):
    r = requests.get(
        f'https://api.jcdecaux.com/vls/v1/stations?contract={arg}&apiKey={JCD_API_KEY}')
    if r.status_code != 200:
        print("Error with request to JCDecaux API: check your city name and API key")

    else:
        # parse json
        data = json.loads(r.text)

        # connect to database and create curson
        conn = pymysql.connect(
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
                # convert from milliseconds to unix time
                last_update = station['last_update'] / 1000

                # insert each station's data
                cursor.execute("""
                    INSERT INTO availability (number, available_bike_stands, available_bikes, last_update)
                    VALUES (%s, %s, %s, %s)
                """, (number, available_bike_stands, available_bikes, last_update))  # temp, precipitation, wind sppeed

                conn.commit()
            except:
                print(
                    f"Duplicate data, station number: {number} @ {datetime.fromtimestamp(last_update)}, not adding")

        print(f'Last update: {datetime.now()}')

    headers = {"accept": "application/json"}
    # 7 day forecast including realtime
    url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={arg}&aqi=no"
    r_weather = requests.get(url, headers=headers)

    if r_weather.status_code != 200:
        print(
            f"Failed to fetch from weather API. Status Code: {r_weather.status_code}")
    else:
        print("Successful fetch from weather API.")
        response_dictionary = r_weather.json()
        weather_data_cache = response_dictionary

        try:

            conn = pymysql.connect(
            host=DB,
            user=DB_USER,
            password=DB_PW,
            database=arg
            )

            cursor = conn.cursor()

            current_data = weather_data_cache['current']

            cursor.execute("""
                    INSERT INTO weather (
                           last_update, temp_c, temp_f, 
                           is_day, wind_mph, wind_kph, wind_degree,
                            wind_dir, pressure_mb, pressure_in, precip_mm, 
                           precip_in, humidity, cloud, feelslike_c, 
                           feelslike_f, vis_km, vis_miles, uv, 
                           gust_mph, gust_kph
                           )
                           
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                            %s)
                """, (current_data['last_updated_epoch'],
                      current_data['temp_c'],
                      current_data['temp_f'],
                      current_data['is_day'],
                      current_data['wind_mph'],
                      current_data['wind_kph'],
                      current_data['wind_degree'],
                      current_data['wind_dir'],
                      current_data['pressure_mb'],
                      current_data['pressure_in'],
                      current_data['precip_mm'],
                      current_data['precip_in'],
                      current_data['humidity'],
                      current_data['cloud'],
                      current_data['feelslike_c'],
                      current_data['feelslike_f'],
                      current_data['vis_km'],
                      current_data['vis_miles'],
                      current_data['uv'],
                      current_data['gust_mph'],
                      current_data['gust_kph']
                      )
            )

            conn.commit()

        except pymysql.Error as e:
            print(e)


if __name__ == "__main__":
    # Check if there is exactly one command-line argument (excluding the script name)
    if len(sys.argv) != 2:
        print("Usage: python scrape.py <city_name>")
        sys.exit(1)

    else:
        # Extract the argument
        arg = sys.argv[1]
        main(arg)
