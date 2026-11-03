import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, rowDuration } from '../src/overview.ts';
test('empty input gives no rows', () => assert.deepEqual(buildRows([], 4, 8), []));
test('fills rows sequentially', () => {
    const r = buildRows([...'abcdefghijkl'], 3, 4);
    assert.deepEqual(r, [[...'abcd'], [...'efgh'], [...'ijkl']]);
});
test('cycles when too few names', () => {
    const r = buildRows(['A', 'B', 'C'], 2, 4);
    assert.deepEqual(r, [['A', 'B', 'C', 'A'], ['B', 'C', 'A', 'B']]);
});
test('every row has perRow cards', () => assert.ok(buildRows([1, 2], 6, 12).every(r => r.length === 12)));
test('durations within 40–60s and varied', () => {
    const d = [0, 1, 2, 3, 4, 5].map(rowDuration);
    assert.ok(d.every(x => x >= 40 && x <= 60)); assert.ok(new Set(d).size > 2);
});
