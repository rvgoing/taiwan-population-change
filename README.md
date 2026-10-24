# taiwan-population-change

以動畫直條圖呈現台灣 8 個縣市（臺北市、新北市、桃園市、臺中市、臺南市、高雄市、屏東縣、宜蘭縣）1974–2025 年的年底人口數變化。

資料只來自 repo 根目錄的 `taiwan_population_1974_2025.json`。

## 功能

- 直條圖：X 軸為縣市、Y 軸為人口數（千分位格式），Y 軸最大值固定為所有年份中的最大人口數
- 年份滑桿（1974–2025）與播放／暫停按鈕，並顯示目前年份
- 開啟頁面自動播放，每 0.8 秒前進一年，播到 2025 後從 1974 重新開始
- 拖動滑桿時自動暫停
- 「依人口排序」開關（預設關閉）：關閉時依固定順序排列，開啟時依當年人口由多到少排序

## 本機啟動

需要 Python 3.9 以上。

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

開啟瀏覽器前往 <http://127.0.0.1:5000/>。

前端的 Chart.js（4.4.1）由 jsDelivr CDN 載入，瀏覽器需能連上網路。

## API

- `GET /` — 首頁
- `GET /api/population` — 回傳 JSON 檔內容（每年一筆，含 `Year_ROC`、`Year_AD` 與各縣市人口數）

## 部署到 Render

repo 已包含 Render 所需設定：

- `render.yaml`：Blueprint 設定（Python web service，`gunicorn app:app` 啟動，健康檢查 `/api/population`）
- `requirements.txt`：含正式環境用的 `gunicorn`
- `.python-version`：指定 Python 3.12

### 方法一：Blueprint（建議）

1. 登入 [Render Dashboard](https://dashboard.render.com/)，點 **New → Blueprint**
2. 連結這個 GitHub repo，Render 會讀取 `render.yaml` 自動建立服務
3. 部署完成後，開啟 Render 提供的 `https://<服務名稱>.onrender.com` 網址

### 方法二：手動建立 Web Service

1. **New → Web Service**，選擇這個 repo
2. 設定：
   - Runtime：`Python 3`
   - Build Command：`pip install -r requirements.txt`
   - Start Command：`gunicorn app:app --bind 0.0.0.0:$PORT`
3. 按 **Create Web Service**

> 免費方案的服務閒置一段時間後會休眠，下次開啟需要等待約數十秒喚醒。
