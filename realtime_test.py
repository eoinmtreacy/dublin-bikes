import mysql.connector
from constants import *
from flask import jsonify
import json


def main():
    """fetch most recent realtime availability data
    for each station
    return for pop-up UI"""

    try:
        # conn = mysql.connector.connect(
        # host=DB,
        # user=DB_USER,
        # password=DB_PW,
        # database=CITY
        # )

        conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW
    )

        cursor = conn.cursor()

        query = ("USE dublin;")

        cursor.execute(query)

        query = (
            """USE dublin;
            SELECT number, available_bikes, MAX(last_update) AS time
            FROM availability
            GROUP BY number;
            """
        )

        results = cursor.fetchall()

        # Convert the results to a list of dictionaries for JSON encoding
        results_dict = [{'number': row[0], 'available_bikes': row[1], 'time': row[2]} for row in results]

        cursor.close()
        conn.close()
        print(results_dict)

    except mysql.connector.Error as e:  
        print("Error connecting to MySQL:", e)
    
if __name__ == "__main__":
    main()