import { decayStep, estimateVelocity, isDrag, rowDuration, screenToPlaneDelta, wrap, type MotionSample } from './overview';

/** Owns one canvas session. All layout reads happen at setup/resize, never per frame. */
/** `paused` sets up geometry and listeners without starting the frame loop (for a prebuilt, parked wall). */
export function startOverviewCanvas(el: HTMLElement, reduced: boolean, onDrag: () => void = () => {}, paused = false) {
    const stage = el.querySelector<HTMLElement>('.overview-stage')!;
    const plane = el.querySelector<HTMLElement>('.overview-plane')!;
    const rows = [...plane.querySelectorAll<HTMLElement>('.overview-row')];
    const tracks = rows.map(row => row.firstElementChild as HTMLElement);
    let active = false, hintStart = 0;
    let samples: MotionSample[] = [];
    let width = 0, pitch = 0, height = 0, scale = 1;
    let x = 0, y = 0, vx = 0, vy = 0, last = performance.now(), resume = last;
    const drift = rows.map(() => 0);
    let pointer: number | null = null, dragged = false, startX = 0, startY = 0, px = 0, py = 0;
    const measure = () => {
        width = (tracks[0].firstElementChild as HTMLElement).offsetWidth;
        pitch = rows[0].offsetHeight + parseFloat(getComputedStyle(plane).getPropertyValue('--gap'));
        height = pitch * rows.length;
        scale = innerWidth < 600 ? 1.25 : 1.45;
        plane.style.width = `${width}px`;
        plane.style.height = `${height}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    const stopNudge = () => {
        if (hintStart && !reduced) {
            const h = Math.min(1, (performance.now() - hintStart) / 900);
            x += 40 * (1 - Math.cos(2 * Math.PI * h));
        }
        hintStart = 0;
    };
    const draw = (nudge = 0) => rows.forEach((row, i) => {
        row.style.transform = `translate3d(0,${wrap(i * pitch + y, height) - height / 2}px,0)`;
        tracks[i].style.transform = `translate3d(${-wrap(-x - nudge - drift[i], width)}px,0,0)`;
    });
    draw();
    let frame = 0;
    const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, .05); last = now;
        if (active && pointer === null && !reduced) {
            const sx = decayStep(vx, dt * 1000), sy = decayStep(vy, dt * 1000);
            x += sx.distance; y += sy.distance; vx = sx.velocity; vy = sy.velocity;
            const ease = Math.min(1, (now - resume) / 1200);
            drift.forEach((_, i) => drift[i] += (i % 2 ? 1 : -1) * width / rowDuration(i) * dt * ease);
        }
        x = wrap(x, width); y = wrap(y, height);
        const h = hintStart ? Math.min(1, (now - hintStart) / 900) : 0;
        draw(active && !reduced ? 40 * (1 - Math.cos(2 * Math.PI * h)) : 0); frame = requestAnimationFrame(tick);
    };
    if (!paused) frame = requestAnimationFrame(tick);
    stage.onpointerdown = e => {
        if (!active || pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
        pointer = e.pointerId; dragged = false; startX = px = e.clientX; startY = py = e.clientY; samples = [{ x: 0, y: 0, time: e.timeStamp }];
        vx = vy = 0;
        // Capture on the original button so an undragged pointer still produces its click.
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        stage.classList.add('is-dragging');
    };
    stage.onpointermove = e => {
        if (pointer !== e.pointerId) return;
        const wasDragged = dragged;
        dragged ||= isDrag(e.clientX - startX, e.clientY - startY);
        const delta = screenToPlaneDelta(e.clientX - (wasDragged ? px : startX), e.clientY - (wasDragged ? py : startY), scale);
        if (dragged) {
            x += delta.x; y += delta.y;
            if (!wasDragged) { stopNudge(); onDrag(); }
        }
        const position = screenToPlaneDelta(e.clientX - startX, e.clientY - startY, scale);
        samples.push({ ...position, time: e.timeStamp });
        samples = samples.filter(sample => e.timeStamp - sample.time <= 100);
        px = e.clientX; py = e.clientY;
    };
    const release = (e: PointerEvent) => {
        if (pointer !== e.pointerId) return;
        pointer = null; resume = performance.now();
        const velocity = estimateVelocity(samples, e.timeStamp);
        vx = velocity.x; vy = velocity.y;
        if (reduced || !dragged || e.type !== 'pointerup') vx = vy = 0;
        const target = e.target as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
        stage.classList.remove('is-dragging');
    };
    stage.onpointerup = release; stage.onpointercancel = release; stage.onlostpointercapture = release;
    const suppress = (e: MouseEvent) => { if (dragged && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); } };
    stage.addEventListener('click', suppress, true);
    const wheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!active) return;
        stopNudge(); onDrag();
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
        const delta = screenToPlaneDelta(-(e.shiftKey ? e.deltaY : e.deltaX) * unit, -(e.shiftKey ? e.deltaX : e.deltaY) * unit, scale);
        x += delta.x; y += delta.y; vx = Math.max(-2400, Math.min(2400, delta.x * 8)); vy = Math.max(-2400, Math.min(2400, delta.y * 8)); resume = performance.now();
    };
    stage.addEventListener('wheel', wheel, { passive: false });
    return {
        setActive(value: boolean) { if (!value) { stopNudge(); draw(); } active = value; resume = performance.now(); vx = vy = 0; },
        resume() { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); } },
        nudge() { hintStart = performance.now(); },
        panBy(dx: number, dy: number) { x = wrap(x + dx, width); y = wrap(y + dy, height); draw(); },
        stop() {
        cancelAnimationFrame(frame); observer.disconnect();
        stage.onpointerdown = stage.onpointermove = stage.onpointerup = stage.onpointercancel = stage.onlostpointercapture = null;
        stage.removeEventListener('wheel', wheel); stage.removeEventListener('click', suppress, true);
        }
    };
}
