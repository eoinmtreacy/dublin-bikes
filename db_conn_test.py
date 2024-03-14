import mysql.connector
from constants import *

try:
    conn = mysql.connector.connect(
        host=DB,
        user=DB_USER,
        password=DB_PW
    )
    print("connected")
except:
    print("can't connect.")