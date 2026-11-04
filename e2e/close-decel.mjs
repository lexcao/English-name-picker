import { chromium, webkit } from 'playwright';
const br = process.env.BR === 'webkit' ? webkit : chromium;
const b = await br.launch(process.env.BR === 'webkit' ? {} : { channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' })).newPage();
await p.addInitScript(() => { window.L = []; const f = t => { const tr = document.querySelector('#overview:not(.is-pre) .overview-track');
  if (tr) { const m = new DOMMatrix(getComputedStyle(tr).transform); window.L.push([t, m.m41]); } requestAnimationFrame(f); }; requestAnimationFrame(f); });
await p.goto('http://localhost:8766/English-name-picker/#/choose', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.click('#overview-open'); await p.waitForTimeout(3000);
const mode = process.argv[2] || 'esc';
if (mode === 'drag') { await p.mouse.move(640, 400); await p.mouse.down(); for (let i = 0; i < 8; i++) { await p.mouse.move(640 - i * 40, 400); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(150); }
await p.evaluate(() => { window.L = []; window.T0 = performance.now(); }); await p.evaluate(()=>{window.L=[]; window.T0=performance.now()-0;}); await p.waitForTimeout(100);
if (mode==='back') await p.goBack(); else await p.keyboard.press('Escape'); await p.waitForTimeout(900);
const L = await p.evaluate(() => window.L.map(([t, x]) => [t - window.T0, x]));
let out = []; for (let i = 1; i < L.length; i++) out.push(`${L[i][0].toFixed(0)}:${(L[i][1] - L[i - 1][1]).toFixed(2)}`);
console.log(out.join(' ')); await b.close();
