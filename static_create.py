import requests
import json
from constants import JCD_API_KEY
import sys

def fetch_city_static(arg):
        r = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={arg}&apiKey={JCD_API_KEY}')
        # parse json
        data = json.loads(r.text)

        json.dumps(data, indent=4)

        with open(f"./stations/{arg}_stations.json", "w") as json_file:
            json_file.write(json.dumps(data, indent=4))

if __name__ == "__main__":
    # Check if there is exactly one command-line argument (excluding the script name)
    if len(sys.argv) != 2:
        print("Usage: python static_create.py <city_name>")
        sys.exit(1)

    # Extract the argument
    arg = sys.argv[1]

    # Process the argument
    fetch_city_static(arg)


