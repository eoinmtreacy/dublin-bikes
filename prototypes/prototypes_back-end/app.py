from flask import Flask, render_template

# initialise flask app
app = Flask(__name__)

# create landing page
@app.route('/')
def landing():
    """serve landing page html from /templates folder"""
    return render_template('draft4.html')

if __name__ == '__main__':
    app.run(debug=True)
