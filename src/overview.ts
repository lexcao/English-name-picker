/** Split names into marquee rows; each row has exactly perRow items, cycling names when there are too few. */
export function buildRows<T>(names: readonly T[], rowCount: number, perRow: number): T[][] {
    if (!names.length || rowCount < 1 || perRow < 1) return [];
    return Array.from({ length: rowCount }, (_, r) =>
        Array.from({ length: perRow }, (_, i) => names[(r * perRow + i) % names.length]));
}
/** Per-row loop duration in seconds: 40–60s, deterministic so rows don't jump between renders. */
export function rowDuration(row: number): number {
    return 40 + ((row * 7) % 5) * 5;
}

/** Positive modulo, including negative pans. */
export function wrap(value: number, size: number): number {
    return size > 0 ? ((value % size) + size) % size : 0;
}
/** Exact exponential friction integration; velocity is plane pixels per second. */
export function inertiaStep(velocity: number, seconds: number, friction = 5) {
    const decay = Math.exp(-friction * Math.max(0, seconds));
    return { velocity: velocity * decay, distance: friction > 0 ? velocity * (1 - decay) / friction : velocity * Math.max(0, seconds) };
}
export function screenToPlaneDelta(x: number, y: number, scale = 1.45, zDegrees = -22, xDegrees = 18) {
    const angle = zDegrees * Math.PI / 180;
    const dx = x / scale, dy = y / (scale * Math.cos(xDegrees * Math.PI / 180));
    return { x: dx * Math.cos(angle) + dy * Math.sin(angle), y: -dx * Math.sin(angle) + dy * Math.cos(angle) };
}
export function isDrag(x: number, y: number, threshold = 6): boolean {
    return Math.hypot(x, y) >= threshold;
}

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export function smoothstep(a: number, b: number, p: number) {
    const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
    return t * t * (3 - 2 * t);
}
/** Exact critically damped spring; preserving velocity makes retargeting continuous. */
export function springStep(position: number, velocity: number, target: number, seconds: number) {
    const dt = Math.max(0, Math.min(seconds, .05)), omega = Math.sqrt(170);
    const offset = position - target, b = velocity + omega * offset, decay = Math.exp(-omega * dt);
    return { position: target + (offset + b * dt) * decay, velocity: (velocity - omega * b * dt) * decay };
}
export type MotionSample = { x: number; y: number; time: number };
export function estimateVelocity(samples: readonly MotionSample[], now: number, max = 2400) {
    let x = 0, y = 0, weight = 0;
    for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1], b = samples[i], dt = b.time - a.time;
        if (dt <= 0 || now - a.time > 80) continue;
        const w = Math.max(0, 1 - (now - b.time) / 80) * dt;
        x += (b.x - a.x) / dt * 1000 * w; y += (b.y - a.y) / dt * 1000 * w; weight += w;
    }
    x = weight ? x / weight : 0; y = weight ? y / weight : 0;
    const factor = Math.min(1, max / (Math.hypot(x, y) || 1));
    return { x: x * factor, y: y * factor };
}
export function decayStep(velocity: number, dtMs: number) {
    const step = inertiaStep(velocity, Math.max(0, dtMs) / 1000, -1000 * Math.log(.998));
    return { distance: step.distance, velocity: Math.abs(step.velocity) < 5 ? 0 : step.velocity };
}
