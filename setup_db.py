from sqlalchemy import create_engine
from password import Password
from sqlalchemy.dialects.mysql import mysqldb


PASSWORD = Password().get()
URI = "database-1.c7w22mqua0gp.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "database-1"
USER = "root"

engine = create_engine("mysqldbs://{}:{}@{}:{}/{}".format(USER, PASSWORD, URI, PORT, DB), echo=True)


sql = """
CREATE DATABASE IF NOT EXISTS dbikes;
"""

engine.execute(sql)

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
    res = engine.execute("DROP TABLE IF EXISTS station")
    res = engine.execute(sql)
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
    res = engine.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)