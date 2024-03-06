from flask import Flask, render_template, request, jsonify
import json
from flask_cors import CORS
from constants import *
# from local_constants import * 
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
    # this won't work on campus without an SSH tunnel but should be okay at home 
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

        columns = [desc[0] for desc in cursor.description]

        # Fetch all rows
        rows = cursor.fetchall()

        # Combine column names and data into a list of dictionaries
        results = []
        for row in rows:
            result = {}
            for i in range(len(columns)):
                result[columns[i]] = row[i]
            results.append(result)

        # with open('static/stations.json', 'w') as json_file:
        #     json.dump(results, json_file)

        cursor.close()
        conn.close()
        print("Data fetched from databse")
        return jsonify(data=results)

    except:
        print("Error fetching from DB, parsing local file")
        with open('static/stations.json', 'r') as file:
            data = json.load(file)
        return data['stations']
    
@app.route('/realtime')
def realtime():
    """fetch most recent realtime availability data
    for each station
    return for pop-up UI"""

    try:
        conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW,
        database=DB_NAME
        )

        cursor = conn.cursor()

        query = (
            """SELECT number, MAX(last_update) AS time
            FROM availability
            GROUP BY number;
            """
        )

        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)

    except:
        return 'FAILURE realtime'

if __name__ == '__main__':
    app.run(debug=True)
