# taiwan-population-change

以動畫呈現臺灣八縣市 1974–2025 年的年底人口數，使用 Chart.js 與靜態 JSON。
Vercel 以純靜態 HTML/JS/JSON 部署，不需要 Flask 或常駐伺服器；Render 保留 Flask 相容服務。

## 功能

- 橫向長條圖顯示年度人口數；縣市採固定顏色，排序後仍能辨識
- 年份滑桿、播放／暫停、每 0.8 秒前進一年；比較刻度固定
- 若資料、Chart.js 或 HTTP 回應出錯，顯示錯誤提示與重試按鈕
- 尊重系統「減少動態效果」設定，仍可手動播放

## 資料

唯一人口資料檔為 `public/data/taiwan_population_1974_2025.json`，涵蓋 1974–2025 年。
目前專案尚未完整附上各年度原始統計機關、資料來源與行政區改制對照，尚不能視作完成官方統計驗證。

## Vercel（純靜態）

- Framework Preset: Other（`vercel.json` 設定 framework 為 null）
- Output Directory: `public`
- Build Command: 留空；不需要 Node、Python、Flask 或 Serverless Function
- Production Branch: `main`
- HTML: `/`；資料：`/data/taiwan_population_1974_2025.json`
- Git 整合如已開啟，推送 main 將觸發部署；在 Vercel Dashboard 驗證 Production 狀態。

## Render（維持原服務）

`render.yaml` 仍使用 Flask/Gunicorn。相同 HTML、CSS、JS 與 JSON 由 Flask 提供。
原 `/api/population` 保留供舊客戶端及 Render 健康檢查使用。

本機測試：
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/*.test.cjs
python app.py
```

GitHub Actions 於每次推送與 PR 執行 Python / Node 測試。Chart.js 4.4.1 從 jsDelivr 載入，需有網路連線。
