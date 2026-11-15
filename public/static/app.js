(function (root) {
  "use strict";

  const REGIONS = Object.freeze(["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市", "屏東縣", "宜蘭縣"]);
  const COLORS = Object.freeze({
    "臺北市": "#64748b", "新北市": "#2563eb", "桃園市": "#0891b2", "臺中市": "#0d9488",
    "臺南市": "#d97706", "高雄市": "#db2777", "屏東縣": "#8b5cf6", "宜蘭縣": "#65a30d",
  });
  const START_YEAR = 1974;
  const END_YEAR = 2025;
  const STEP_MS = 800;

  function orderedRegions(row, sortByPopulation) {
    const labels = REGIONS.slice();
    if (sortByPopulation) {
      labels.sort((a, b) => row[b] - row[a] || REGIONS.indexOf(a) - REGIONS.indexOf(b));
    }
    return labels;
  }

  function validateRows(rows) {
    if (!Array.isArray(rows) || rows.length !== END_YEAR - START_YEAR + 1) {
      throw new Error("人口資料年份數量不符");
    }
    rows.forEach((row, index) => {
      const year = START_YEAR + index;
      if (!row || row.Year_AD !== year || row.Year_ROC !== year - 1911 ||
          REGIONS.some((region) => !Number.isSafeInteger(row[region]) || row[region] < 0)) {
        throw new Error("人口資料格式錯誤或缺少年份：" + year);
      }
    });
    return rows;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { REGIONS, COLORS, orderedRegions, validateRows };
  }
  if (typeof document === "undefined") return;

  const yearLabel = document.getElementById("year-label");
  const slider = document.getElementById("year-slider");
  const playBtn = document.getElementById("play-btn");
  const sortToggle = document.getElementById("sort-toggle");
  const status = document.getElementById("status");
  const retryBtn = document.getElementById("retry-btn");
  const fmt = new Intl.NumberFormat("zh-TW");
  let byYear = new Map();
  let chart = null;
  let currentYear = START_YEAR;
  let timer = null;

  function pause() {
    if (timer !== null) root.clearInterval(timer);
    timer = null;
    playBtn.textContent = "播放";
    playBtn.setAttribute("aria-pressed", "false");
  }

  function render(year) {
    if (!chart || !byYear.has(year)) return;
    currentYear = year;
    const row = byYear.get(year);
    const names = orderedRegions(row, sortToggle.checked);
    chart.data.labels = names;
    chart.data.datasets[0].data = names.map((name) => row[name]);
    chart.data.datasets[0].backgroundColor = names.map((name) => COLORS[name]);
    chart.update();
    yearLabel.textContent = year + " 年（民國 " + row.Year_ROC + " 年）";
    slider.value = String(year);
  }

  function play() {
    if (!chart || timer !== null) return;
    timer = root.setInterval(() => {
      render(currentYear >= END_YEAR ? START_YEAR : currentYear + 1);
    }, STEP_MS);
    playBtn.textContent = "暫停";
    playBtn.setAttribute("aria-pressed", "true");
  }

  function showError(message) {
    yearLabel.textContent = "無法顯示人口圖表";
    status.textContent = message;
    status.hidden = false;
    retryBtn.hidden = false;
    playBtn.disabled = true;
    slider.disabled = true;
    sortToggle.disabled = true;
  }

  async function load() {
    pause();
    status.hidden = true;
    retryBtn.hidden = true;
    playBtn.disabled = true;
    slider.disabled = true;
    sortToggle.disabled = true;
    yearLabel.textContent = "資料載入中…";
    try {
      if (typeof root.Chart !== "function") {
        throw new Error("Chart.js 圖表套件未載入，請確認網路連線");
      }
      const res = await root.fetch("/data/taiwan_population_1974_2025.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const rows = validateRows(await res.json());
      byYear = new Map(rows.map((row) => [row.Year_AD, row]));
      const maxPop = Math.max(...rows.flatMap((row) => REGIONS.map((region) => row[region])));
      if (chart) chart.destroy();
      chart = new root.Chart(document.getElementById("chart"), {
        type: "bar",
        data: { labels: [], datasets: [{ label: "年底人口數", data: [], backgroundColor: [] }] },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          animation: { duration: root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450 },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => fmt.format(ctx.parsed.x) + " 人" } },
          },
          scales: {
            x: { min: 0, max: maxPop, title: { display: true, text: "人口數（人）" }, ticks: { callback: (value) => fmt.format(value) } },
            y: { title: { display: false } },
          },
        },
      });
      playBtn.disabled = false;
      slider.disabled = false;
      sortToggle.disabled = false;
      render(START_YEAR);
      if (!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches)) play();
    } catch (error) {
      pause();
      showError("資料或圖表載入失敗：" + error.message + "。請按「重新載入資料」再試一次。");
    }
  }

  playBtn.addEventListener("click", () => timer !== null ? pause() : play());
  slider.addEventListener("input", () => { pause(); render(Number(slider.value)); });
  sortToggle.addEventListener("change", () => render(currentYear));
  retryBtn.addEventListener("click", () => {
    if (typeof root.Chart !== "function") root.location.reload();
    else load();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  load();
})(typeof window !== "undefined" ? window : globalThis);
