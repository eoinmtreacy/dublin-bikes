from flask import Flask, render_template, request, jsonify
import json
from constants import *
import requests


# initialise flask app
app = Flask(__name__)

# stop Flask from caching to make sure production changes are represented
app.config["CACHE_TYPE"] = "null"

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

@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        data = request.json
        dropdown1_value = data['dropdown1']
        dropdown2_value = data['dropdown2']
        dropdown3_value = data['dropdown3']

        # Perform operations with the dropdown values
        # For example, you could process them and return a result
        result = {
            'dropdown1_value': dropdown1_value,
            'dropdown2_value': dropdown2_value,
            'dropdown3_value': dropdown3_value
        }
        return jsonify(result)
    else:
        return 'Method not allowed'

# Open the JSON file for reading

if __name__ == '__main__':
    app.run(debug=True)
