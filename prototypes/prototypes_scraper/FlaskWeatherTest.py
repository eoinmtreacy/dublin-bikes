# from flask import Flask, jsonify
# from flask_sqlalchemy import SQLAlchemy
# import mysql.connector

# user = 
# password = 
# host = 
# port = 3306,
# dbSchema = 



# app = Flask(__name__)   # Flask constructor 
# # decorator to route URL 


# app.secret_key = 'key'
# app.config['SQLALCHEMY_DATABASE_URI'] = 

# db = SQLAlchemy(app)




# class WeatherData(db.Model):
#     __tablename__ = 'WeatherData'
#     time_of_execution = db.Column(db.String(25))
#     location_name = db.Column(db.String(20), primary_key=True, nullable=False)
#     time_of_update = db.Column(db.String(20))
#     cloud_cover = db.Column(db.Numeric(10, 2))
#     humidity = db.Column(db.Numeric(10, 2))
#     precipitation_probability = db.Column(db.Numeric(10, 2))
#     temperature = db.Column(db.Numeric(10, 2))
#     weather_code = db.Column(db.Integer)
#     weather_description = db.Column(db.String(50))
#     wind_direction = db.Column(db.Numeric(10, 2))
#     wind_speed = db.Column(db.Numeric(10, 2))
    
    
# @app.route('/') #Homepage 
# # binding to the function of route  
# # def index():      
# #     weather_data = WeatherData.query.all()
# #     html = '<h1>Weather Data Table:</h1>'
# #     html += '<table border="1">'
# #     html += '<tr>'
# #     html += '<th>Time of Execution</th>'
# #     html += '<th>Time of Update</th>'
# #     html += '<th>Cloud Cover</th>'
# #     html += '<th>Humidity</th>'
# #     html += '<th>Precipitation Probability</th>'
# #     html += '<th>Temperature</th>'
# #     html += '<th>Weather Code</th>'
# #     html += '<th>Weather Description</th>'
# #     html += '<th>Wind Direction</th>'
# #     html += '<th>Wind Speed</th>'
# #     html += '</tr>'
    
# #     for weather in weather_data:
# #         html += f'<tr><td>{weather.time_of_execution}</td><td>{weather.time_of_update}</td><td>{weather.cloud_cover}</td><td>{weather.humidity}</td><td>{weather.precipitation_probability}</td><td>{weather.temperature}</td><td>{weather.weather_code}</td><td>{weather.weather_description}</td><td>{weather.wind_direction}</td><td>{weather.wind_speed}</td></tr>'
    
# #     html += '</table>'
# #     return html

# def index():
#     # Inline HTML content with JavaScript for fetching weather data
#     html_content = """
#     <!DOCTYPE html>
# <html lang="en">
# <head>
#     <meta charset="UTF-8">
#     <title>Weather Information</title>
# </head>
# <body>
#     <h1>Weather Information</h1>
#     <div id="weather">Loading weather data...</div>
#     <!-- Placeholder for the weather icon -->
#     <div id="weather-icon"></div>

#     <script>
#         fetch('/api/weather')
#             .then(response => response.json())
#             .then(data => {
#                 document.getElementById('weather').innerHTML = 
#                     'Temperature: ' + Math.round(data.temperature) + '°C, ' +
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from datetime import datetime
import atexit

def shutdown_scheduler():
    scheduler.shutdown()
    print("Cleanup Complete")

atexit.register(shutdown_scheduler)

app = Flask(__name__)
app.secret_key = 'key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://

db = SQLAlchemy(app)



class WeatherData(db.Model):
    __tablename__ = 'WeatherData'
    location_name = db.Column(db.String(20), primary_key=True, nullable=False)
    time_of_execution = db.Column(db.String(50), nullable=False)
    time_of_update = db.Column(db.String(20), nullable=False)
    cloud_cover = db.Column(db.Numeric(10, 2), nullable=False)
    humidity = db.Column(db.Numeric(10, 2), nullable=False)
    precipitation_probability = db.Column(db.Numeric(10, 2), nullable=False)
    temperature = db.Column(db.Numeric(10, 2), nullable=False)
    weather_code = db.Column(db.Integer, nullable=False)
    weather_description = db.Column(db.String(50), nullable=False)
    wind_direction = db.Column(db.Numeric(10, 2), nullable=False)
    wind_speed = db.Column(db.Numeric(10, 2), nullable=False)
    
class WeatherCodes(db.Model):
    __tablename__ = 'WeatherCodes'
    weather_code = db.Column(db.Integer, unique=True, primary_key=True)
    weather_description = db.Column(db.String(50))

WEATHER_API_KEY = 'z75jlVJgZqAFz0At9k578zSlomT7tiHD'
CITY = 'dublin'
# Function to fetch weather data and update the database
def fetch_and_update_weather():
    with app.app_context():  # Push an application context
        headers = {"accept": "application/json"}
        url = f"https://api.tomorrow.io/v4/weather/realtime?location={CITY}&units=metric&apikey={WEATHER_API_KEY}"

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            response_dictionary = response.json()
            data = response_dictionary['data']['values']
            time_of_update = response_dictionary['data']['time']
            weather = WeatherData(
                time_of_execution=datetime.now().strftime('%d-%m-%Y | %H:%M:%S'),
                location_name=CITY,
                time_of_update=time_of_update,
                cloud_cover=data.get('cloudCover', 0),
                humidity=data.get('humidity', 0),
                precipitation_probability=data.get('precipitationProbability', 0),
                temperature=data.get('temperature', 0),
                weather_code=data.get('weatherCode', 0),
                wind_direction=data.get('windDirection', 0),
                wind_speed=data.get('windSpeed', 0)
            )
            db.session.merge(weather)  # Assuming location_name is unique and can be used as an identifier
            db.session.commit()
            
            print("Weather data updated successfully\t" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))
            update_weather_description()
        else:
            print("Failed to fetch weather data" + "\n" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))



@app.route('/api/weather')
def get_weather():
    weather = WeatherData.query.first()
    if weather:
        return jsonify({
            'temperature': weather.temperature,
            'humidity': weather.humidity,
            'weather_code': weather.weather_code,
            'weather_description': weather.weather_description
        })
    else:
        return jsonify({'message': 'Weather data not found'}), 404
    
# Flask route for updating weather descriptions
# Flask route for updating weather descriptions
@app.route('/update_weather_description')

def update_weather_description():
    try:
        # Get a list of WeatherData objects to update
        weather_data_to_update = (
            db.session.query(WeatherData)
            .join(WeatherCodes, WeatherData.weather_code == WeatherCodes.weather_code)
            .all()
        )

        # Update weather descriptions
        for weather_data in weather_data_to_update:
            weather_data.weather_description = WeatherCodes.query.filter_by(weather_code=weather_data.weather_code).first().weather_description

        # Commit the changes
        db.session.commit()

        print("Weather descriptions updated successfully\t" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))

    except Exception as e:
        print(f"An error occurred: {str(e)}" + "\n" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))
# Initialize Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=fetch_and_update_weather, trigger="interval", minutes=3, next_run_time=datetime.now())  # Adjust the interval as needed
scheduler.start()

def initialize():
    # Manually call the function to update weather immediately at startup
    fetch_and_update_weather()

@app.route('/')
def index():
    # Inline HTML content with JavaScript for fetching weather data
    html_content = """
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Weather Information</title>
</head>
<body>
    <h1>Weather Information</h1>
    <div id="weather">Loading weather data...</div>
    <!-- Placeholder for the weather icon -->
    <div id="weather-icon"></div>

    <script>
        fetch('/api/weather')
            .then(response => response.json())
            .then(data => {
                document.getElementById('weather').innerHTML = 
                    'Temperature: ' + Math.round(data.temperature) + '°C, ' +
                    'Humidity: ' + Math.round(data.humidity) + '%, ' +
                    'Weather Code: ' + data.weather_code + ', ' +
                    'Description: ' + data.weather_description;
                
                // Construct the URL for the SVG file based on the weather code
                const iconUrl = `/static/weather_icons/${data.weather_code}.svg`;

                // Display the SVG image
                document.getElementById('weather-icon').innerHTML = 
                    `<img src="${iconUrl}" alt="Weather Icon" style="width:100px;height:100px;">`;
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('weather').textContent = 'Failed to load weather data.';
            });
    </script>
</body>
</html>
    """
    return html_content





if __name__ == '__main__':
    atexit.register(shutdown_scheduler)
    db.create_all()
    scheduler.start()
    
    try:
        app.run(use_reloader=False)  # Use reloader=False to prevent duplicate jobs
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        atexit.register(shutdown_scheduler)
        print("Cleanup Complete")   # Properly shutdown the scheduler when the app exits
