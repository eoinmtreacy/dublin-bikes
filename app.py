from flask import Flask, render_template, request, jsonify
import json
from flask_cors import CORS
from constants import *
# from local_constants import * 
import requests
import mysql.connector
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import atexit
import pickle
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
        print(f"Fetching weather data from API at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        headers = {"accept": "application/json"}
        url = f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}=Dublin&days=7&aqi=no&alerts=no" # 7 day forecast including realtime
        response = requests.get(url, headers=headers)
        response_dictionary = response.json()
        global weather_data_cache # Use global variable to store the weather data
        weather_data_cache = response_dictionary
        if response.status_code == 200:
            print("Successful fetch from weather API.")
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
            print(error_message)

@app.route('/api/WeatherForecast', methods=['POST']) # Adjusted to accept POST requests
def fetchWeatherForecast():
    global weather_data_cache # Use global variable to retrieve the weather data
    print("Fetching weather forecast")
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
            print("No weather data available")
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
    """serve landing page html from /templates folder
    calls weather api
    """
    # TODO uncomment
    # headers = {"accept": "application/json"}
    # url = f"https://api.tomorrow.io/v4/weather/realtime?location={CITY}&units=metric&apikey={WEATHER_API_KEY}"

    # response = requests.get(url, headers=headers)
        
    return render_template('index.html', google_maps_api_key=GOOGLE_MAPS_API_KEY, )

@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        data = request.json

        # import model for depart station
        with open(f"./models/{data['station']}.pkl", 'rb') as file:
            model = pickle.load(file)

        params = [float(p) for p in data['params']]

        params = np.asarray(params).reshape(1,-1)
        
        print("params", params)

        prediction = model.predict(params)

        return jsonify(data=prediction)
    else:
        return 'Method not allowed'

# Open the JSON file for reading
@app.route('/stations')
def stations():
    # this won't work on campus without an SSH tunnel but should be okay at home 
    # try:
    #     conn = mysql.connector.connect(
    #     host=DB,
    #     user=DB_USER,
    #     password=DB_PW,
    #     database=CITY
    #     )

    #     cursor = conn.cursor()

    #     query = (
    #         "SELECT * "
    #         "FROM stations"
    #     )

    #     cursor.execute(query)

    #     columns = [desc[0] for desc in cursor.description]

    #     # Fetch all rows
    #     rows = cursor.fetchall()

    #     # Combine column names and data into a list of dictionaries
    #     results = []
    #     for row in rows:
    #         result = {}
    #         for i in range(len(columns)):
    #             result[columns[i]] = row[i]
    #         results.append(result)

    #     # with open('static/stations.json', 'w') as json_file:
    #     #     json.dump(results, json_file)

    #     cursor.close()
    #     conn.close()
    #     print("Data fetched from databse")
    #     return jsonify(data=results)

    # except:
    print("Error fetching from DB, parsing local file")
    with open('stations.json', 'r') as file:
        data = json.load(file)
    return jsonify(data=data)
    
@app.route('/realtime')
def realtime():
    """fetch most recent realtime availability data
    for each station
    return for pop-up UI"""

    # try:
    #     conn = mysql.connector.connect(
    #     host=DB,
    #     user=DB_USER,
    #     password=DB_PW,
    #     database=CITY
    #     )

    #     cursor = conn.cursor()

    #     query = (
    #         """SELECT number, available_bikes, MAX(last_update) AS time
    #         FROM availability
    #         GROUP BY number;
    #         """
    #     )

    #     cursor.execute(query)
    #     results = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     print("Succesfully got realtime")
    #     return jsonify(results)

    # except:
    #     print("Error fetching realtime")
    #     return 'FAILURE realtime'

    print("Error fetching from DB, parsing local file")
    with open('realtime.json', 'r') as file:
        data = json.load(file)
    return jsonify(data)

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
            conn = mysql.connector.connect(
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
                    AND last_update >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 12 HOUR))
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
            print("Succesfully got recent data")
            return jsonify(results)

        except:
            print("Error fetching recent data")
            return 'FAILURE realtime'
        
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
            conn = mysql.connector.connect(
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
            print("Succesfully got recent data")
            return jsonify(results)

        except:
            print("Error fetching recent data")
            return 'FAILURE realtime'

if __name__ == '__main__':
    app.run(debug=True)
