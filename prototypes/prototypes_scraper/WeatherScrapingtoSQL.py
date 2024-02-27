import requests
from sqlalchemy import create_engine, text 
import pymysql #Needed as it was not running otherwise on my Mac
#From Eoin's GitHub Code:
from constants import * #Contains CITY, WEATHER_API_KEY
from sqlalchemy.dialects.mysql import mysqldb 
import json
import time
from datetime import datetime

# Reference 1

# PYTHON FUNCTION TO CONNECT TO THE MYSQL DATABASE AND RETURN THE SQLACHEMY ENGINE OBJECT - Ref: GeeksForGeeks 
def get_connection():
    return create_engine(
        url=f"mysql+pymysql://{DB_USER}:{DB_PW}@{DB}:3306/{DB_NAME}", echo=True)





# Error Handling - Ref: GeeksForGeeks
try:
    engine = get_connection()
    print("Connected to the DB Server Successfully!")
except Exception as e :
    print("Connection failed due to the following error: \n", e)

connection = engine.connect() #Establish a connection

# SQL to create table (if needed)

SQL_Query_1 = text("""
    CREATE TABLE IF NOT EXISTS WeatherData (
    time_of_execution VARCHAR(25),
    location_name VARCHAR(10),
    time_of_update VARCHAR(20),
    cloud_cover DECIMAL(10,2),
    humidity DECIMAL(10,2),
    precipitation_probability DECIMAL(10,2),
    temperature DECIMAL(10,2),
    weather_code INT,
    weather_description VARCHAR(50),
    wind_direction DECIMAL(10,2),
    wind_speed DECIMAL(10,2),
    PRIMARY KEY (location_name)
)
""")

SQL_Query_2 = text("""
        CREATE TABLE IF NOT EXISTS WeatherCodes (
            weather_code INT,
            weather_description VARCHAR(50),
            PRIMARY KEY (weather_code)
)
""")

SQL_Query_3 = text("""
    INSERT IGNORE INTO WeatherCodes (weather_code, weather_description)
    VALUES 
    (0, 'Unknown'),
    (1000, 'Clear, Sunny'),
    (1100, 'Mostly Clear'),
    (1101, 'Partly Cloudy'),
    (1102, 'Mostly Cloudy'),
    (1001, 'Cloudy'),
    (2000, 'Fog'),
    (2100, 'Light Fog'),
    (4000, 'Drizzle'),
    (4001, 'Rain'),
    (4200, 'Light Rain'),
    (4201, 'Heavy Rain'),
    (5000, 'Snow'),
    (5001, 'Flurries'),
    (5100, 'Light Snow'),
    (5101, 'Heavy Snow'),
    (6000, 'Freezing Drizzle'),
    (6001, 'Freezing Rain'),
    (6200, 'Light Freezing Rain'),
    (6201, 'Heavy Freezing Rain'),
    (7000, 'Ice Pellets'),
    (7101, 'Heavy Ice Pellets'),
    (7102, 'Light Ice Pellets'),
    (8000, 'Thunderstorm')
    """)

try:
    res = connection.execute(SQL_Query_1)
    connection.commit()
    print("\n\n\nWeatherData Table Created Successfully\n\n\n")
except Exception as e:
    print(e)
try:
    res2 = connection.execute(SQL_Query_2)
    connection.commit()
    print("\n\n\nWeatherCodes Table Created Successfully\n\n\n")
except Exception as e:
    print(e)
try:
    res3 = connection.execute(SQL_Query_3)
    connection.commit()
    print("\n\n\nWeatherCodes Table Populated Successfully")
except Exception as e:
    print(e)

while True: #Loop to allow constant data collection
    #Provided by API Documentation
    headers = {
        "accept": "application/json"
    }
    url = f"https://api.tomorrow.io/v4/weather/realtime?location={CITY}&units=metric&apikey={WEATHER_API_KEY}" #CITY and WEATHER_API_KEY stored in constants.py
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        response_dictionary = response.json() #Convert JSON to Dictionary - Reference 2
        weather_values = response_dictionary['data']['values'] #Nested Dictionary Structure - Reference 3, 4
        time_of_update = response_dictionary['data']['time'] #Time of Weather Update is stored in seperate list to other values
        location_name = CITY #Location stored in constants.py
        time_of_data = datetime.now() #Time when the Loop is ran

    else:
        print("API Issue")

    conn = pymysql.connect(
            user=DB_USER,
            password=DB_PW,
            host=DB,
            port=3306,
            database=DB_NAME)

    cursor = conn.cursor()
    try:
        

        # Reference 6, 7
        
        SQL_Query_4 = """
            INSERT INTO WeatherData(time_of_execution, location_name, time_of_update, cloud_cover, humidity, precipitation_probability, temperature, weather_code, wind_direction, wind_speed)
            VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            time_of_execution = VALUES(time_of_execution), 
            time_of_update = VALUES(time_of_update),
            cloud_cover = VALUES(cloud_cover), humidity = VALUES(humidity),
            precipitation_probability = VALUES(precipitation_probability),
            temperature = VALUES(temperature), weather_code = VALUES(weather_code),
            wind_direction = VALUES(wind_direction), wind_speed = VALUES(wind_speed);
            """
            
        # Reference 8
        #get function to retrive value from key in weather_values dictionary
        WeatherDataValues = (
            time_of_data.strftime('%d-%m-%Y | %H:%M:%S'), location_name, time_of_update, weather_values.get('cloudCover'),
            weather_values.get('humidity'), weather_values.get('precipitationProbability'), weather_values.get('temperature'), weather_values.get('weatherCode'),
            weather_values.get('windDirection'), weather_values.get('windSpeed')
        )
        
        SQL_Query_5 = """
        UPDATE WeatherData
        JOIN WeatherCodes ON WeatherData.weather_code = WeatherCodes.weather_code
        SET WeatherData.weather_description = WeatherCodes.weather_description;
        """
        

        cursor.execute(SQL_Query_4, WeatherDataValues)
        conn.commit()
        cursor.execute(SQL_Query_5)
        conn.commit()
        
    
    
    
        print(f'Last update: {datetime.now()}')
    except Exception as e:
        print("Failed to update WeatherData")
        print(e)

    
    finally:
        # Close Connections whether successful or not
        cursor.close()
        conn.close()
    
    time.sleep(180)  # Run every 3 minutes
    # Free API allows:
        # 500 requests per day
        # 25 requests per hour
        # 3 requests per second

        # In this case there can be 20 requests per hour over 24 hours which equals a request every 3 minutes


#References
# 1: https://www.geeksforgeeks.org/connecting-to-sql-database-using-sqlalchemy-in-python/
# 2: https://www.geeksforgeeks.org/response-json-python-requests/
# 3: https://stackoverflow.com/questions/51788550/parsing-json-nested-dictionary-using-python
# 4: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
# 5: https://www.geeksforgeeks.org/connect-to-mysql-using-pymysql-in-python/
# 6: https://pynative.com/python-mysql-execute-parameterized-query-using-prepared-statement/
# 7: https://www.geeksforgeeks.org/insert-on-duplicate-key-update-in-mysql/
# 8: https://www.geeksforgeeks.org/python-strftime-function/

