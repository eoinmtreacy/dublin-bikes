from flask import Flask, render_template
import json
from constants import *
import requests

# initialise flask app
app = Flask(__name__)

with open('dublin.json', 'r') as file:
    # Load JSON data from the file
    data = json.load(file)

print([(station['number'], station['name'], station['latitude'], station['longitude']) for station in data])



# create landing page
@app.route('/')
def landing():
    """serve landing page html from /templates folder
    calls weather api
    """

    headers = {"accept": "application/json"}
    url = f"https://api.tomorrow.io/v4/weather/realtime?location={CITY}&units=metric&apikey={WEATHER_API_KEY}"

    response = requests.get(url, headers=headers)

    print(response.status_code)

    return render_template('index.html')

# Open the JSON file for reading

if __name__ == '__main__':
    app.run(debug=True)
