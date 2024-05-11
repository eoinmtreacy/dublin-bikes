import pymysql
from constants import *

try:
    conn = pymysql.connect(
        host=HOST,
        user=DB_USER,
        password=DB_PW,
        port=PORT
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
except pymysql.Error as e:
    print("Error connecting to MySQL:", e)
