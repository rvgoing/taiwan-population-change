"""Flask compatibility server for the same static site served by Vercel."""
import json
from pathlib import Path
from flask import Flask, jsonify, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
DATA_FILE = PUBLIC_DIR / "data" / "taiwan_population_1974_2025.json"

app = Flask(__name__, static_folder=str(PUBLIC_DIR / "static"), static_url_path="/static")
app.json.ensure_ascii = False
app.json.sort_keys = False

@app.get("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")

@app.get("/data/taiwan_population_1974_2025.json")
def static_population():
    return send_from_directory(PUBLIC_DIR / "data", "taiwan_population_1974_2025.json")

@app.get("/api/population")
def population():
    """Preserve the original Render API for existing consumers."""
    with DATA_FILE.open(encoding="utf-8") as source:
        return jsonify(json.load(source))

if __name__ == "__main__":
    app.run(debug=True)
