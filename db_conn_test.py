import mysql.connector
from constants import *

try:
    conn = mysql.connector.connect(
        host='localhost',
        port=3306,
        user='root',
        password='mysql',
    )
    print("connected")

    cursor = conn.cursor()

    query = (
        """SHOW DATABASES;"""
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
