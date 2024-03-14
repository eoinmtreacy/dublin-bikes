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
        """SHOW DATABASES;"""
    )

    cursor.execute(query)

    cursor.close()
    conn.close()
except:
    print("can't connect.")