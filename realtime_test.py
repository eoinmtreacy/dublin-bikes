import mysql.connector
from constants import *
from flask import jsonify


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
            """SELECT number, available_bikes, MAX(last_update) AS time
            FROM availability
            GROUP BY number;
            """
        )

        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        print(jsonify(results))
        return jsonify(results)

        print("SUCCESS")

    except:
        print('FAILURE realtime')
    
if __name__ == "__main__":
    main()