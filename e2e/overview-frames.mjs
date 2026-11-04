import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8766/English-name-picker/#/choose', N=+(process.argv[3]||5);
const b = await chromium.launch({channel:'chrome'}); const R={};
const rec = pg => pg.evaluate(()=>new Promise(r=>{const out=[];let last=performance.now(),t0=last,seen=false;const f=n=>{out.push(Math.round(n-last));last=n;const o=document.getElementById('overview');const s=o&&o.classList.contains('is-settled');if(n-t0<1500&&!(n-t0>150&&(!o||s)))requestAnimationFrame(f);else r(out.slice(1))};requestAnimationFrame(f)}));
for (let run=0;run<N;run++) for (const mode of ['button','esc','back','card']) {
const pg = await b.newPage({viewport:{width:1280,height:800}});
const cdp = await pg.context().newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await pg.goto(url,{waitUntil:'networkidle'}); await pg.waitForTimeout(500);
let o; if(process.env.AFTER){await pg.click('#overview-open'); o=rec(pg);} else {o = rec(pg); await pg.click('#overview-open');} const open = await o; await pg.waitForTimeout(800);
await pg.mouse.move(640,400); await pg.mouse.down(); for(let i=0;i<10;i++) await pg.mouse.move(640-i*30,400); await pg.mouse.up(); await pg.waitForTimeout(1500);
let p = process.env.AFTER?null:rec(pg);
if (mode==='button') await pg.click('#overview-close'); else if (mode==='esc') await pg.keyboard.press('Escape'); else if (mode==='back') await pg.goBack({waitUntil:'commit'}).catch(()=>{}); else await pg.mouse.click(640,400);
if(!p) p=rec(pg); const close = await p;
for (const [k,a] of [['open',open],['close-'+mode,close]]) (R[k]??=[]).push({max:Math.max(...a),over20:a.filter(x=>x>20).length,at:a.map((x,i)=>x>20?i+':'+x:'').filter(Boolean).join(' ')});
await pg.close(); }
for (const [k,v] of Object.entries(R)) { const m=v.map(x=>x.max).sort((a,b)=>a-b), o=v.map(x=>x.over20); console.log(k, 'runs',v.length,'over20/run',o.join(','),'maxFrame median',m[m.length>>1],'worst',m[m.length-1], v.map(x=>x.at).join(' | ')); }
await b.close();
