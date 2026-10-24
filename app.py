import json
from pathlib import Path

from flask import Flask, jsonify, render_template

DATA_FILE = Path(__file__).resolve().parent / "taiwan_population_1974_2025.json"

app = Flask(__name__)
app.json.ensure_ascii = False
app.json.sort_keys = False


def load_population():
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/population")
def population():
    return jsonify(load_population())


if __name__ == "__main__":
    app.run(debug=True)
