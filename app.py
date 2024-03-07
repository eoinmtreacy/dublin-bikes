from flask import Flask, render_template, request, jsonify
import json
from flask_cors import CORS
from constants import *
# from local_constants import * 
import requests
import mysql.connector
import pickle
import numpy as np
from sklearn.preprocessing import PolynomialFeatures

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
        depart = data['depart']
        departTime = data['departTime']
        departDay = data['departDay']
        arrive = data['arrive']
        arriveTime = data['arriveTime']
        arriveDay = data['arriveDay']

        depart = [depart] + [int(departTime)] + departDay
        arrive = [arrive] + [int(arriveTime)] + arriveDay

        print(depart, arrive)

        # import model for depart station
        with open(f'./models/{depart[0]}.pkl', 'rb') as file:
            model = pickle.load(file)

        # Linear model trained on Polynomial
        # transformation of these features
        poly = PolynomialFeatures(degree=4)
        X_poly = poly.fit_transform(np.asarray(depart[1:]).reshape(1, -1))

        # format query corretly for the model
        departPrediction = model.predict(X_poly)

        # import model for arrive station
        with open(f'./models/{arrive[0]}.pkl', 'rb') as file:
            model = pickle.load(file)

        # Linear model trained on Polynomial
        # transformation of these features
        poly = PolynomialFeatures(degree=4)
        X_poly = poly.fit_transform(np.asarray(arrive[1:]).reshape(1, -1))

        # format query corretly for the model
        arrivePrediction = model.predict(X_poly)

        # Perform operations with the dropdown values
        # For example, you could process them and return a result
        result = {
            'departAvailability': departPrediction[0],
            'arriveAvailability': arrivePrediction[0]
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
            """SELECT number, available_bikes, MAX(last_update) AS time
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
