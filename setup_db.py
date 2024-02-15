from sqlalchemy import create_engine
from constants import Password
from sqlalchemy.dialects.mysql import mysqldb
from constants import * # contains DB_USER, DB_PW

URI = "database-1.c7w22mqua0gp.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "database-1"

engine = create_engine(f'mysql+mysqldb://{DB_USER}:{DB_PW}@{URI}:{PORT}/{DB_USER}', echo=True)

connection = engine.connect()


sql = """
CREATE DATABASE IF NOT EXISTS dbikes;
"""

connection.execute(sql)

sql = """
CREATE TABLE IF NOT EXISTS station (
address VARCHAR(256),
banking INTEGER,
bike_stands INTEGER,
bonus INTEGER,
contract_name VARCHAR(256),
name VARCHAR(256),
number INTEGER,
position_lat REAL,
position_lng REAL,
status VARCHAR(256)
)
"""

try:
    res = connection.execute("DROP TABLE IF EXISTS station")
    res = connection.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)

sql = """
CREATE TABLE IF NOT EXISTS availability (
number INTEGER,
available_bikes INTEGER,
available_bike_stands INTEGER,
last_update INTEGER
)
"""

try:
    res = connection.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)