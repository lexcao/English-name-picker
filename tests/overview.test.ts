import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, rowDuration, wrap, inertiaStep, screenToPlaneDelta, isDrag } from '../src/overview.ts';
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

test('wrap handles negative offsets, exact seams and many tiles', () => {
    assert.equal(wrap(-1, 100), 99);
    assert.equal(wrap(-300, 100), 0);
    assert.equal(wrap(1234567, 100), 67);
    assert.equal(wrap(10, 0), 0);
});
test('inertia decays and integrates independently of frame rate', () => {
    const whole = inertiaStep(300, 1);
    const first = inertiaStep(300, .4);
    const second = inertiaStep(first.velocity, .6);
    assert.ok(Math.abs(whole.distance - first.distance - second.distance) < 1e-10);
    assert.ok(Math.abs(whole.velocity - second.velocity) < 1e-10);
    assert.ok(whole.velocity > 0 && whole.velocity < 300);
    assert.equal(inertiaStep(-300, 1).distance, -whole.distance);
    assert.deepEqual(inertiaStep(300, 0), { velocity: 300, distance: 0 });
    assert.deepEqual(inertiaStep(300, 1, 0), { velocity: 300, distance: 300 });
});
test('inverse plane mapping restores screen movement through rotation, tilt and scale', () => {
    for (const scale of [1.25, 1.45]) {
        const point = screenToPlaneDelta(70, -35, scale);
        const z = -22 * Math.PI / 180, tilt = 18 * Math.PI / 180;
        const x = scale * (point.x * Math.cos(z) - point.y * Math.sin(z));
        const y = scale * Math.cos(tilt) * (point.x * Math.sin(z) + point.y * Math.cos(z));
        assert.ok(Math.abs(x - 70) < 1e-10);
        assert.ok(Math.abs(y + 35) < 1e-10);
    }
    assert.deepEqual(screenToPlaneDelta(4, 8, 1, 0, 0), { x: 4, y: 8 });
});
test('drag threshold measures radial travel at the six pixel boundary', () => {
    assert.equal(isDrag(0, 0), false);
    assert.equal(isDrag(3, 4), false);
    assert.equal(isDrag(6, 0), true);
    assert.equal(isDrag(0, -6), true);
    assert.equal(isDrag(-5, -5), true);
});
