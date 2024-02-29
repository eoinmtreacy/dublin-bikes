from flask import Flask, render_template, jsonify 
import json
from flask_cors import CORS
from constants import GOOGLE_MAPS_API_KEY, WEATHER_API_KEY, CITY 
import requests

# initialise flask app
app = Flask(__name__)
CORS(app)



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

    return render_template('index.html', google_maps_api_key=GOOGLE_MAPS_API_KEY)
# Open the JSON file for reading
@app.route('/stations')
def stations():
    with open('static/dublin.json', 'r') as file:
        data = json.load(file)
    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True)
