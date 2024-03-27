import mysql.connector
from constants import *

try:
    conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW
    )
    print("connected")

    cursor = conn.cursor()

    query = (
        "USE dublin;"
        "SELECT * "
        "FROM availability;"
    )

    cursor.execute(query)

    # Fetch all the rows
    databases = cursor.fetchall()

    # Print each database
    for db in databases:
        print(db[0])

    cursor.close()
    conn.close()
except mysql.connector.Error as e:
    print("Error connecting to MySQL:", e)
