import os
import magic
import json
import pathlib
import numpy as np
import pandas as pd

from werkzeug.utils import secure_filename
from flask import Flask, flash, redirect, url_for, render_template, request

ALLOWED_CONTENTS = [{'content_type': 'text/plain', 'extension': 'txt'}, 
                    {'content_type': 'text/csv', 'extension': 'csv'}, 
                    {'content_type': 'application/vnd.ms-excel', 'extension': 'xls'}, 
                    {'content_type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'extension': 'xlsx'}]

app = Flask(__name__)

def allowed_file(file):
    return any(a['content_type'] == file.content_type for a in ALLOWED_CONTENTS)

@app.route('/', methods = ['GET'])
def index():
    return render_template('index.html', name = 'Index Page Map')

@app.route('/upload', methods = ['POST'])
def upload_file():

    if 'the_file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    
    f = request.files['the_file']

    if f.filename == '':
        flash('No selected file')
        return redirect(request.url)

    if not f or not allowed_file(f):
        return 'Invalid file type! The only allowed extenscoordinatesns are *.{}'.format(', *.'.join(list(a['extension'] for a in ALLOWED_CONTENTS)).upper()), 400

    file_extension = pathlib.Path(secure_filename(f.filename)).suffix

    if file_extension in ['.txt', '.csv']:
        coordinates = pd.read_csv(f, converters= {
            'latitude': lambda s: float(s),
            'longitude': lambda s: float(s),
        })
    else:
        coordinates = pd.read_excel(f, converters= {
            'latitude': lambda s: float(s),
            'longitude': lambda s: float(s),
        })

    if not {'latitude', 'longitude'}.issubset(coordinates.columns):
        return 'Invalid file format! Columns latitude and longitude not found!', 404

    coordinates.insert(loc = 0, column = 'index', value = np.arange(len(coordinates)))

    return coordinates.to_json(orient = 'records', index = True), 200

if __name__ == '__main__':
    app.debug = False
    app.run()