(function () {
  const FIXED_ORDER = ["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市", "屏東縣", "宜蘭縣"];
  const START_YEAR = 1974;
  const END_YEAR = 2025;
  const STEP_MS = 800;

  const yearLabel = document.getElementById("year-label");
  const slider = document.getElementById("year-slider");
  const playBtn = document.getElementById("play-btn");
  const sortToggle = document.getElementById("sort-toggle");
  const fmt = new Intl.NumberFormat("zh-TW");

  let byYear = {};
  let chart = null;
  let currentYear = START_YEAR;
  let timer = null;

  function labelsFor(year) {
    const row = byYear[year];
    const labels = FIXED_ORDER.slice();
    if (sortToggle.checked) {
      labels.sort((a, b) => row[b] - row[a]);
    }
    return labels;
  }

  function render(year) {
    currentYear = year;
    const labels = labelsFor(year);
    chart.data.labels = labels;
    chart.data.datasets[0].data = labels.map((name) => byYear[year][name]);
    chart.update();
    yearLabel.textContent = year + " 年（民國 " + byYear[year].Year_ROC + " 年）";
    slider.value = year;
  }

  function play() {
    if (timer) return;
    timer = setInterval(() => {
      render(currentYear >= END_YEAR ? START_YEAR : currentYear + 1);
    }, STEP_MS);
    playBtn.textContent = "暫停";
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    playBtn.textContent = "播放";
  }

  playBtn.addEventListener("click", () => (timer ? pause() : play()));
  slider.addEventListener("input", () => {
    pause();
    render(Number(slider.value));
  });
  sortToggle.addEventListener("change", () => render(currentYear));

  fetch("/api/population")
    .then((res) => res.json())
    .then((rows) => {
      rows.forEach((row) => { byYear[row.Year_AD] = row; });
      const maxPop = Math.max(...rows.flatMap((row) => FIXED_ORDER.map((name) => row[name])));

      chart = new Chart(document.getElementById("chart"), {
        type: "bar",
        data: {
          labels: [],
          datasets: [{
            label: "年底人口數",
            data: [],
            backgroundColor: "#1f6feb",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: (ctx) => fmt.format(ctx.parsed.y) + " 人" },
            },
          },
          scales: {
            x: { title: { display: true, text: "縣市" } },
            y: {
              min: 0,
              max: maxPop,
              title: { display: true, text: "人口數" },
              ticks: { callback: (value) => fmt.format(value) },
            },
          },
        },
      });

      render(START_YEAR);
      play();
    })
    .catch((err) => {
      yearLabel.textContent = "資料載入失敗";
      console.error(err);
    });
})();
