const test = require('node:test');
const assert = require('node:assert/strict');
const { REGIONS, COLORS, orderedRegions, validateRows } = require('../public/static/app.js');

function row(year, overrides = {}) {
  return Object.fromEntries([
    ['Year_AD', year], ['Year_ROC', year - 1911],
    ...REGIONS.map((name, idx) => [name, 1000 + idx * 10]),
    ...Object.entries(overrides),
  ]);
}
function dataset() { return Array.from({ length: 52 }, (_, i) => row(1974 + i)); }

test('fixed order preserved when sorting is disabled', () => {
  assert.deepEqual(orderedRegions(row(1974), false), REGIONS);
});
test('descending population ranking and deterministic ties', () => {
  const year = row(2025, { '臺北市': 3000, '新北市': 3000, '屏東縣': 5000 });
  assert.deepEqual(orderedRegions(year, true).slice(0, 3), ['屏東縣', '臺北市', '新北市']);
});
test('colors remain attached to names as rank changes', () => {
  const first = orderedRegions(row(1974, { '臺北市': 100 }), true);
  const last = orderedRegions(row(2025, { '臺北市': 10000 }), true);
  assert.notDeepEqual(first, last);
  assert.equal(COLORS['臺北市'], '#64748b');
  assert.equal(new Set(Object.values(COLORS)).size, REGIONS.length);
  assert.deepEqual(Object.fromEntries(first.map(name => [name, COLORS[name]])),
                   Object.fromEntries(last.map(name => [name, COLORS[name]])));
});
test('valid year series accepted', () => { assert.equal(validateRows(dataset()).length, 52); });
test('missing year rejected', () => { assert.throws(() => validateRows(dataset().slice(1)), /年份數量/); });
test('non-integer population rejected', () => {
  const data = dataset(); data[4]['高雄市'] = '123';
  assert.throws(() => validateRows(data), /資料格式/);
});
test('misaligned calendar and ROC year rejected', () => {
  const data = dataset(); data[9].Year_ROC = 99;
  assert.throws(() => validateRows(data), /資料格式/);
});
