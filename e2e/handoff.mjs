// No-clone camera: the real top stack card flies. Track its rect per rAF; fail on discontinuities
// (a frame step far larger than its neighbours), on leftover transforms/will-change, or any clone.
import { chromium, webkit } from 'playwright';
const br = process.env.BR === 'webkit' ? webkit : chromium;
const b = await br.launch(process.env.BR === 'webkit' ? {} : { channel: 'chrome' });
const URL = process.argv[2] || 'http://localhost:8766/English-name-picker/#/choose';
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' })).newPage();
await p.addInitScript(() => { window.L = []; const f = t => {
  const el = document.querySelector('.swipe-card.is-top');
  if (el) { const r = el.getBoundingClientRect(); window.L.push({ t, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, o: +getComputedStyle(el).opacity }); }
  requestAnimationFrame(f); }; requestAnimationFrame(f); });
const W = ms => p.waitForTimeout(ms);
await p.goto(URL, { waitUntil: 'networkidle' }); await W(1500);
const fails = [], report = [];
const settled = () => p.evaluate(() => { const el = document.querySelector('.swipe-card.is-top'); const cs = getComputedStyle(el);
  return { transform: el.style.transform, willChange: cs.willChange, clones: document.querySelectorAll('.overview-morph').length, overview: !!document.querySelector('#overview:not(.is-pre)') }; });
function jumps(L) { // visible frames only; a step > 3x the larger neighbour step and > 8px is a pop
  let worst = 0; const V = L.filter(r => r.o > .05);
  for (let i = 2; i < V.length - 1; i++) { const s = j => Math.hypot(V[j].x - V[j - 1].x, V[j].y - V[j - 1].y, V[j].w - V[j - 1].w);
    if (V[i].t - V[i - 1].t > 40) continue; const d = s(i), n = Math.max(s(i - 1), s(i + 1), 1); if (d > 8) worst = Math.max(worst, d / n); }
  return worst; }
async function run(name, close) {
  await p.evaluate(() => { window.L = []; }); await p.click('#overview-open'); await W(3000);
  await close(); await W(1600);
  const L = await p.evaluate(() => window.L), j = jumps(L), s = await settled();
  
  const ok = j < 3 && s.transform === '' && s.willChange === 'auto' && s.clones === 0 && !s.overview;
  report.push(`${ok ? 'PASS' : 'FAIL'} ${name} jumpRatio=${j.toFixed(2)} ${JSON.stringify(s)}`); if (!ok) fails.push(name);
}
await run('button', () => p.click('#overview-close'));
await run('esc', () => p.keyboard.press('Escape'));
await run('back', () => p.goBack());
await run('card', () => p.mouse.click(400, 300));
await p.click('#overview-open'); await W(400); await p.keyboard.press('Escape'); await W(250); await p.click('#overview-open'); await W(2500);
const st = await p.evaluate(() => ({ overviews: document.querySelectorAll('#overview').length, revealed: !!document.querySelector('#overview.is-revealed'), hiddenRows: [...document.querySelectorAll('#overview:not(.is-pre) .overview-row')].filter(r => getComputedStyle(r).opacity !== '1').length, clones: document.querySelectorAll('.overview-morph').length, hist: !!history.state?.overview }));
const tok = st.revealed && st.hiddenRows === 0 && st.clones === 0 && st.hist && st.overviews === 1;
report.push(`${tok ? 'PASS' : 'FAIL'} fast-toggle ${JSON.stringify(st)}`); if (!tok) fails.push('fast');
await p.keyboard.press('Escape'); await W(1500); const s = await settled();
const eok = s.transform === '' && s.willChange === 'auto' && !s.overview; report.push(`${eok ? 'PASS' : 'FAIL'} final ${JSON.stringify(s)}`); if (!eok) fails.push('final');
console.log(report.join('\n')); await b.close(); process.exit(fails.length ? 1 : 0);
