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
