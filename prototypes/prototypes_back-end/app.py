from flask import Flask, render_template
import json

# initialise flask app
app = Flask(__name__)

with open('./prototypes/prototypes_back-end/dublin.json', 'r') as file:
    # Load JSON data from the file
    data = json.load(file)

print([(station['number'], station['name'], station['latitude'], station['longitude']) for station in data])

# create landing page
@app.route('/')
def landing():
    """serve landing page html from /templates folder"""
    return render_template('draft4.html')

# Open the JSON file for reading

if __name__ == '__main__':
    app.run(debug=True)
