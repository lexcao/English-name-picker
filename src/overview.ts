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
