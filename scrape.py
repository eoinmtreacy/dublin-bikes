import requests

contract_name = 'dublin'
api_key = '4c0892699aba5ab6f5f9c65bfb93fcd6fae2e49f'

r = requests.get(f'https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}')
print(json.loads(r.text))

engine = create_engine(f'mysql://root:@port:3306/')