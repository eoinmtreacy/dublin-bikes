import requests
from constants import *

r = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={CITY}&apiKey={JCD_API_KEY}')
print(r.text)