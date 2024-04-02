import mysql.connector
from constants import *
import json

conn = mysql.connector.connect(
host=DB,
user=DB_USER,
password=DB_PW,
database=CITY
)

cursor = conn.cursor()

query = (
    "SELECT * "
    "FROM stations"
)

cursor.execute(query)

columns = [desc[0] for desc in cursor.description]

# Fetch all rows
rows = cursor.fetchall()

# Combine column names and data into a list of dictionaries
results = []
for row in rows:
    result = {}
    for i in range(len(columns)):
        result[columns[i]] = row[i]
    results.append(result)

cursor.close()
conn.close()

data = json.dumps(results, indent=4)

with open('stations.json', 'w') as f:
    f.write(data)
