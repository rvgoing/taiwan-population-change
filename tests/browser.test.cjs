const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { REGIONS } = require('../public/static/app.js');

const source = fs.readFileSync(path.resolve(__dirname, '../public/static/app.js'), 'utf8');
const data = Array.from({length: 52}, (_, i) => {
  const year = 1974 + i;
  return Object.fromEntries([['Year_AD', year], ['Year_ROC', year - 1911], ...REGIONS.map((name, j) => [name, (8-j) * 100 + i])]);
});

function createPage(fetchImpl) {
  const elements = {};
  for (const id of ['year-label', 'year-slider', 'play-btn', 'sort-toggle', 'status', 'retry-btn', 'chart']) {
    elements[id] = {
      listeners: {}, hidden: false, disabled: false, checked: false, value: '', textContent: '',
      addEventListener(type, handler) { this.listeners[type] = handler; },
      setAttribute(name, value) { this[name] = value; },
    };
  }
  let chart;
  class ChartStub {
    constructor(element, config) { this.data = config.data; chart = this; }
    update() { this.updated = true; }
    destroy() { this.destroyed = true; }
  }
  const window = {
    Chart: ChartStub, fetch: fetchImpl,
    matchMedia: () => ({ matches: true }),
    setInterval: () => 1, clearInterval: () => {}, location: { reload() {} },
  };
  const document = { hidden: false, getElementById: id => elements[id], addEventListener: () => {} };
  vm.runInNewContext(source, { window, document, console, Intl }, { filename: 'app.js' });
  return { elements, get chart() { return chart; } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('failed static JSON request shows error and a retry control', async () => {
  const page = createPage(async () => { throw new Error('network unavailable'); });
  await settle();
  assert.equal(page.elements.status.hidden, false);
  assert.match(page.elements.status.textContent, /載入失敗/);
  assert.equal(page.elements['retry-btn'].hidden, false);
  assert.equal(page.elements['play-btn'].disabled, true);
});
test('retry recovers and preserves a fixed color per region after sorting', async () => {
  let fail = true;
  const page = createPage(async () => {
    if (fail) { fail = false; throw new Error('transient failure'); }
    return { ok: true, json: async () => data };
  });
  await settle();
  assert.equal(page.elements['retry-btn'].hidden, false);
  page.elements['retry-btn'].listeners.click();
  await settle();
  assert.equal(page.elements.status.hidden, true);
  assert.equal(page.elements['play-btn'].disabled, false);
  const before = Object.fromEntries(page.chart.data.labels.map((name, i) => [name, page.chart.data.datasets[0].backgroundColor[i]]));
  page.elements['sort-toggle'].checked = true;
  page.elements['sort-toggle'].listeners.change();
  const after = Object.fromEntries(page.chart.data.labels.map((name, i) => [name, page.chart.data.datasets[0].backgroundColor[i]]));
  assert.deepEqual(after, before);
  assert.equal(page.chart.updated, true);
});
test('HTTP 404 is treated as an error instead of parsing response JSON', async () => {
  const page = createPage(async () => ({ok: false, status: 404, json: async () => data}));
  await settle();
  assert.match(page.elements.status.textContent, /HTTP 404/);
});
