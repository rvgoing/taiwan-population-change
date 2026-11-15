"""Static publishing integrity and backwards-compatible Flask routes."""
import json
import re
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
PUBLIC_DIR = BASE_DIR / "public"
DATA_FILE = PUBLIC_DIR / "data" / "taiwan_population_1974_2025.json"

class PopulationDataTests(unittest.TestCase):
    def test_52_consecutive_years_and_region_values(self):
        with DATA_FILE.open(encoding="utf-8") as file:
            rows = json.load(file)
        self.assertEqual(len(rows), 52)
        regions = ("臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市", "屏東縣", "宜蘭縣")
        for year, row in zip(range(1974, 2026), rows):
            with self.subTest(year=year):
                self.assertEqual(row["Year_AD"], year)
                self.assertEqual(row["Year_ROC"], year - 1911)
                self.assertTrue(all(type(row[region]) is int and row[region] >= 0 for region in regions))

    def test_static_page_has_no_flask_template_syntax(self):
        html = (PUBLIC_DIR / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("{{", html)
        self.assertNotIn("{%", html)
        for path in re.findall(r'(?:src|href)="(/(?:static|data)/[^\"]+)"', html):
            self.assertTrue((PUBLIC_DIR / path.lstrip("/")).is_file(), path)

    def test_vercel_configuration_points_to_static_site(self):
        config = json.loads((BASE_DIR / "vercel.json").read_text())
        self.assertEqual(config["outputDirectory"], "public")
        self.assertIsNone(config["framework"])

class FlaskCompatibilityTests(unittest.TestCase):
    def setUp(self):
        try:
            from app import app
        except ImportError as exc:
            self.skipTest("Flask not installed: " + str(exc))
        self.client = app.test_client()

    def test_home_and_assets(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertIn(b"/static/app.js", self.client.get("/").data)
        self.assertEqual(self.client.get("/static/app.js").status_code, 200)
        self.assertEqual(self.client.get("/static/style.css").status_code, 200)

    def test_data_and_legacy_api_match(self):
        response = self.client.get("/data/taiwan_population_1974_2025.json")
        self.assertEqual(response.status_code, 200)
        api = self.client.get("/api/population")
        self.assertEqual(api.status_code, 200)
        self.assertEqual(api.get_json(), response.get_json())

if __name__ == "__main__":
    unittest.main()
