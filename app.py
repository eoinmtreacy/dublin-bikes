from flask import Flask, render_template, request, jsonify
import json
from flask_cors import CORS
from constants import *
import requests
import mysql.connector

# initialise flask app
app = Flask(__name__)
CORS(app)

# stop Flask from caching to make sure production changes are represented
app.config["CACHE_TYPE"] = "null"

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
@app.route('/stations')
def stations():
    try:
        conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW,
        database=DB_NAME
        )

        cursor = conn.cursor()

        query = (
            "SELECT * "
            "FROM station"
        )

        cursor.execute(query)
        results = cursor.fetchall()
        json_result = json.dumps(results)
        cursor.close()
        conn.close()

    except:
        # TODO uncomment
        # with open('static/dublin.json', 'r') as file:
        #     data = json.load(file)
        # return data['stations']
        pass

if __name__ == '__main__':
    app.run(debug=True)
