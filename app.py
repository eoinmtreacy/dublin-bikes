from flask import Flask, render_template, request, jsonify
import json
from flask_cors import CORS
import pymysql
from constants import *
# from local_constants import * 
import requests
import mysql.connector
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import atexit
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

# initialise flask app
app = Flask(__name__)
CORS(app)
app.secret_key = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
# stop Flask from caching to make sure production changes are represented
app.config["CACHE_TYPE"] = "null"

db = SQLAlchemy(app) # Initialize the database

weather_data_cache = {} # Cache for weather data
# Refernce: https://www.digitalocean.com/community/tutorials/how-to-use-flask-sqlalchemy-to-interact-with-databases-in-a-flask-application
@app.route('/api/CurrentWeather')
def fetchCurrentWeather():
    with app.app_context():  # Push an application context Reference https://flask.palletsprojects.com/en/2.3.x/appcontext/
        # print(f"Fetching weather data from API at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        headers = {"accept": "application/json"}
        url = f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}=Dublin&days=7&aqi=no&alerts=no" # 7 day forecast including realtime
        response = requests.get(url, headers=headers)
        response_dictionary = response.json()
        global weather_data_cache # Use global variable to store the weather data
        weather_data_cache = response_dictionary
        if response.status_code == 200:
            # print("Successful fetch from weather API.")
            current_data = weather_data_cache['current']
            weather_data = {
                'humidity': f"{current_data['humidity']}%",
                'condition': current_data['condition']['text'],
                'condition_icon': current_data['condition']['icon'],
                'precip_mm': f"{round(current_data['precip_mm'])}mm",
                'temp_c': f"{round(current_data['temp_c'])}°C"
            }
            return jsonify(weather_data)  # Adjusted to return JSON for API endpoint
        else:
            error_message = f"Failed to fetch from weather API. Status Code: {response.status_code}"
            # print(error_message)

@app.route('/api/WeatherForecast', methods=['POST']) # Adjusted to accept POST requests
def fetchWeatherForecast():
    global weather_data_cache # Use global variable to retrieve the weather data
    # print("Fetching weather forecast")
    with app.app_context():  # Push an application context Reference https://flask.palletsprojects.com/en/2.3.x/appcontext/
        data = request.json
        Day = data.get('day').title() # Capitalise the day
        Time = int(data.get('hour')) # Convert the hour to an integer
        if Day == 'Today': # If the day is today, set the index to 0
            DayIndex = 0
        else:
            today = datetime.now().weekday() # Get the current day of the week
            weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] # List of days of the week
            Day = weekdays.index(Day) # Get the index of the day
            DayIndex = int(Day - today + 7) % 7 # Calculate the index of the day in the forecast data (0-6)
        if not weather_data_cache:  # If the weather data is not available, fetch it
            # print("No weather data available")
            fetchCurrentWeather()
        forecast_data = weather_data_cache['forecast']['forecastday'][int(DayIndex)]['hour'][Time] # Get the forecast data for the specified day and time
        weather_data = {
        'humidity' : f"{forecast_data['humidity']}",
        'condition' : forecast_data['condition']['text'],
        'condition_icon' : forecast_data['condition']['icon'],
        'precip_mm' : f"{round(forecast_data['precip_mm'])}",
        'temp_c' : f"{round(forecast_data['temp_c'])}"
        }
        if weather_data['condition'].endswith('nearby'): # Remove the word "nearby" from the condition
            weather_data['condition'] = weather_data['condition'][:-6]
            weather_data['condition'] = weather_data['condition'].strip().capitalize()
        return jsonify(weather_data) # Adjusted to return JSON for API endpoint 
# create landing page
@app.route('/')
def landing():
    return render_template('index.html', google_maps_api_key=GOOGLE_MAPS_API_KEY, )

@app.route('/predict/<station>', methods=['POST'])
def predict(station):
    if request.method == 'POST':


        try:
            data = request.json
            # import model for depart station
            with open(f"./models/rfr/rfr_{data['station']}.pkl", 'rb') as file:
                model = pickle.load(file)

            params = pd.DataFrame({
                'rain' : [data['params']['rain']],
                'temp': [data['params']['temp']],
                'hum' : [data['params']['hum']],
                'day': [data['params']['day']],
                'hour': [data['params']['hour']]
            })

            prediction = model.predict(params)

            return jsonify(data={'availability': prediction[0]})
        except Exception as e:
            print(e)
            return jsonify(data={'availability': 0,
                        'error': 'Predictions unavailable',
                        'debug' : e})

# Open the JSON file for reading
@app.route('/stations')
def stations():
    # this won't work on campus without an SSH tunnel but should be okay at home 
    try:
        conn = pymysql.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW,
        database=CITY
        )

        cursor = conn.cursor()

        query = (
            "SELECT * "
            "FROM stations"
        )

        cursor.execute(query)

        columns = [desc[0] for desc in cursor.description]

        rows = cursor.fetchall()

        results = [{columns[i]: row[i] for i in range(len(columns))} for row in rows]

        cursor.close()
        conn.close()
        # print("Succesful fetched stations from database")

        return jsonify(results)
    
    except pymysql.Error as e:
        # print(e)s
        with open('stations.json', 'r') as json_file:
            local_data = json.load(json_file)
        return jsonify({"data": local_data, 
                        "error": "Error fetching up-to-date stations, plotting static data"})
    
@app.route('/realtime')
def realtime():
    """fetch most recent realtime availability data
    for each station
    return for pop-up UI"""

    try:
        conn = pymysql.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW,
        database=CITY
        )

        cursor = conn.cursor()

        query = (
            """SELECT number, available_bikes, available_bike_stands, MAX(last_update) AS time
            FROM availability
            GROUP BY number;
            """
        )

        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        # print("Succesfully got realtime")
        return jsonify(results)

    
    except pymysql.Error as e:
        # print(e)
        with open('realtime.json', 'r') as json_file:
            local_data = json.load(json_file)
        return jsonify({"data": local_data, 
                        "error": "Realtime unavailable, current availability is predicted"})

@app.route('/recent', methods=['POST'])
def recent():
    # post method that takes a station number
    # and current time that represents an hour 
    # and returns an array of the average
    # availability for the last 12 hours
    # at that station

    if request.method == 'POST':
        data = request.json
        station = data['station_number']
        try :
            conn = pymysql.connect(
            host=DB,
            user=DB_USER,
            password=DB_PW,
            database=CITY
            )

            cursor = conn.cursor()

            query = (
                f"""
                SELECT HOUR(FROM_UNIXTIME(last_update)) AS hour_of_day,
                    AVG(available_bikes) AS average_available_bikes
                FROM 
                    availability
                WHERE 
                    number = {station}
                    AND last_update >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 11 HOUR))
                GROUP BY 
                    HOUR(FROM_UNIXTIME(last_update))
                ORDER BY 
                    hour_of_day;
                """
            )

            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            # print("Succesfully got recent data")
            return jsonify(results)

        except pymysql.Error as e:
            # print(e)
            return False
        
@app.route('/lastweek', methods=['POST'])
def last_week():
    # post method that takes a station number
    # and current time that represents an hour 
    # and returns an array of the average
    # availability for the last 12 hours
    # at that station

    if request.method == 'POST':
        data = request.json
        station = data['station_number']
        try :
            conn = pymysql.connect(
            host=DB,
            user=DB_USER,
            password=DB_PW,
            database=CITY
            )

            cursor = conn.cursor()

            query = (
                f"""
                    SELECT DATE(FROM_UNIXTIME(last_update)) AS day,
                        AVG(available_bikes) AS avg_available_bikes
                    FROM 
                        availability
                    WHERE 
                        number = {station}
                        AND FROM_UNIXTIME(last_update) >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK) -- Filter for the last week
                        AND FROM_UNIXTIME(last_update) < CURDATE() -- Exclude today
                    GROUP BY 
                        DATE(FROM_UNIXTIME(last_update))  -- Group by date to get averages for each day
                    ORDER BY 
                        day ASC;  -- Order by day in descending order
                """
            )

            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            # print("Succesfully got recent data")
            return jsonify(results)

        except pymysql.Error as e:
            # print(e)
            return False
        
if __name__ == '__main__':
    app.run(debug=True)
