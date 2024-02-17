import mysql
from constants import *

try:
    conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW,
        database=DB_NAME
    )
    print("connected")
except:
    print("can't connect.")