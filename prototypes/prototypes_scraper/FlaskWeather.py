from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from datetime import datetime
import atexit
from constants import *



app = Flask(__name__)
app.secret_key = FLASK_SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI


db = SQLAlchemy(app) # Initialize the database
scheduler = BackgroundScheduler()
def shutdown_scheduler(): # Shutdown the scheduler when the app exits to prevent duplicate jobs 
    scheduler.shutdown()
    print("Cleanup Complete")
    



# Reference: https://www.digitalocean.com/community/tutorials/how-to-use-flask-sqlalchemy-to-interact-with-databases-in-a-flask-application
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

# Function to fetch and update weather data from the Tomorrow.io API
def fetch_and_update_weather():
    with app.app_context():  # Push an application context Reference https://flask.palletsprojects.com/en/2.3.x/appcontext/
        print("Fetching weather data\t" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))
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
            db.session.merge(weather) # Merge the new weather data into the database
            db.session.commit() # Commit the changes
            
            print("Weather data updated successfully\t" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))
            update_weather_description() # Update weather description from WeatherCodes table after fetching new weather data from the API
        else:
            print("Failed to fetch weather data" + "\n" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))



@app.route('/api/weather')
def get_weather():
    weather = WeatherData.query.first() # Get the first weather data entry (Theres only one)
    if weather: # If weather data exists
        print("get_weather success")
        return jsonify({ # Return the weather data as JSON Reference https://www.geeksforgeeks.org/use-jsonify-instead-of-json-dumps-in-flask/
            'temperature': weather.temperature,
            'humidity': weather.humidity,
            'weather_code': weather.weather_code,
            'weather_description': weather.weather_description
        })
        
    else:
        print("get_weather failed")
        return jsonify({'message': 'Weather data not found'}), 404 # Return a 404 error if no weather data is found Reference https://www.geeksforgeeks.org/python-404-error-handling-in-flask/ / https://www.fullstackpython.com/flask-json-jsonify-examples.html
    
# Flask route for updating weather descriptions
@app.route('/update_weather_description')

def update_weather_description():
    try:
        
        update_weather_description = (
            db.session.query(WeatherData) # Query the WeatherData table
            .join(WeatherCodes, WeatherData.weather_code == WeatherCodes.weather_code) # Join the WeatherData and WeatherCodes tables on the weather_code column
            .all() 
        )

        # Update weather descriptions
        for weather_data in update_weather_description:
            weather_data.weather_description = WeatherCodes.query.filter_by(weather_code=weather_data.weather_code).first().weather_description # Update the weather description based on the weather code from the WeatherCodes table Reference: https://www.tutorialspoint.com/sqlalchemy/sqlalchemy_orm_working_with_joins.html

        # Commit the changes
        db.session.commit()

        print("Weather description updated successfully\t" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))

    except Exception as e:
        print(f"An error occurred: {str(e)}" + "\n" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))




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
        <div id="weather">Loading weather data...</div> <!-- Placeholder for the weather data. It will be filled by the JavaScript below. -->
        <div id="weather-icon"></div>

        <script>
            fetch('/api/weather')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('weather').innerHTML =  <!-- Display the weather data in the placeholder weather div Reference: https://www.w3schools.com/jsref/prop_html_innerhtml.asp / https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML -->
                        'Temperature: ' + Math.round(data.temperature) + '°C, ' +
                        'Humidity: ' + Math.round(data.humidity) + '%, ' +
                        'Description: ' + data.weather_description;
                    
                    <!--Construct the source for the SVG file based on the weather code - stored in the static folder  -->
                    const iconUrl = `/static/weather_icons/${data.weather_code}.svg`;

                    <!--Display the icon -->
                    document.getElementById('weather-icon').innerHTML = 
                        `<img src="${iconUrl}" alt="Weather Icon" style="width:100px;height:100px;">`;
                })
                .catch(error => { <!--Catch any errors and display a message in the weather div Reference: https://www.w3schools.com/Jsref/met_console_error.asp -->
                    console.error('Error:', error);
                    document.getElementById('weather').textContent = 'Failed to load weather data.';
                });
        </script>
    </body>
    </html>
        """
    return html_content

def app_start():
    
    atexit.register(shutdown_scheduler) # Register the shutdown function Reference: https://www.geeksforgeeks.org/python-exit-handlers-atexit/
    db.create_all() # Create the database tables if they don't exist
    # Initialize Scheduler
    
    scheduler.start() # Start the scheduler
    scheduler.add_job(func=fetch_and_update_weather, trigger="interval", minutes=3)  # Add Fetch and Update Weather job to be run every 3 minutes (Max Allowed by API)
    print("App Started!")

with app.app_context(): # Push an application context Reference https://flask.palletsprojects.com/en/2.3.x/appcontext/  This is needed to run the app_start function
    try:
        shutdown_scheduler()
    except Exception as e:
        print(f"An error occurred: {str(e)}" + "\n" + datetime.now().strftime('%d-%m-%Y | %H:%M:%S'))
    fetch_and_update_weather()  # Fetch and update weather data when the app starts
    app_start()  # Start the app
