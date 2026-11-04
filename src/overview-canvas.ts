import { inertiaStep, isDrag, rowDuration, screenToPlaneDelta, wrap } from './overview';

/** Owns one canvas session. All layout reads happen at setup/resize, never per frame. */
export function startOverviewCanvas(el: HTMLElement, reduced: boolean) {
    const stage = el.querySelector<HTMLElement>('.overview-stage')!;
    const plane = el.querySelector<HTMLElement>('.overview-plane')!;
    const rows = [...plane.querySelectorAll<HTMLElement>('.overview-row')];
    const tracks = rows.map(row => row.firstElementChild as HTMLElement);
    let width = 0, pitch = 0, height = 0, scale = 1;
    let x = 0, y = 0, vx = 0, vy = 0, last = performance.now(), resume = last;
    const drift = rows.map(() => 0);
    let pointer: number | null = null, dragged = false, startX = 0, startY = 0, px = 0, py = 0, pt = 0;
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
    const draw = () => rows.forEach((row, i) => {
        row.style.transform = `translate3d(0,${wrap(i * pitch + y, height) - height / 2}px,0)`;
        tracks[i].style.transform = `translate3d(${-wrap(-x - drift[i], width)}px,0,0)`;
    });
    draw();
    let frame = 0;
    const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, .05); last = now;
        if (pointer === null && !reduced) {
            const sx = inertiaStep(vx, dt), sy = inertiaStep(vy, dt);
            x += sx.distance; y += sy.distance; vx = sx.velocity; vy = sy.velocity;
            const ease = Math.min(1, (now - resume) / 1000);
            drift.forEach((_, i) => drift[i] += (i % 2 ? 1 : -1) * width / rowDuration(i) * dt * ease);
        }
        x = wrap(x, width); y = wrap(y, height);
        draw(); frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    stage.onpointerdown = e => {
        if (pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
        pointer = e.pointerId; dragged = false; startX = px = e.clientX; startY = py = e.clientY; pt = e.timeStamp;
        vx = vy = 0;
        // Capture on the original button so an undragged pointer still produces its click.
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        stage.classList.add('is-dragging');
    };
    stage.onpointermove = e => {
        if (pointer !== e.pointerId) return;
        dragged ||= isDrag(e.clientX - startX, e.clientY - startY);
        const delta = screenToPlaneDelta(e.clientX - px, e.clientY - py, scale);
        if (dragged) { x += delta.x; y += delta.y; }
        const dt = Math.max(.008, (e.timeStamp - pt) / 1000);
        vx = delta.x / dt; vy = delta.y / dt;
        px = e.clientX; py = e.clientY; pt = e.timeStamp;
    };
    const release = (e: PointerEvent) => {
        if (pointer !== e.pointerId) return;
        pointer = null; resume = performance.now();
        if (reduced || !dragged || e.type === 'pointercancel' || e.timeStamp - pt > 100) vx = vy = 0;
        stage.classList.remove('is-dragging');
    };
    stage.onpointerup = release; stage.onpointercancel = release; stage.onlostpointercapture = release;
    const suppress = (e: MouseEvent) => { if (dragged && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); } };
    stage.addEventListener('click', suppress, true);
    const wheel = (e: WheelEvent) => {
        e.preventDefault();
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
        const delta = screenToPlaneDelta(-e.deltaX * unit, -e.deltaY * unit, scale);
        x += delta.x; y += delta.y; vx = vy = 0; resume = performance.now();
    };
    stage.addEventListener('wheel', wheel, { passive: false });
    return () => {
        cancelAnimationFrame(frame); observer.disconnect();
        stage.onpointerdown = stage.onpointermove = stage.onpointerup = stage.onpointercancel = stage.onlostpointercapture = null;
        stage.removeEventListener('wheel', wheel); stage.removeEventListener('click', suppress, true);
    };
}
