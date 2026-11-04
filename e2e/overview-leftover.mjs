import { chromium } from 'playwright';
const U=(process.argv[2]||'http://localhost:8766/English-name-picker/')+'#/choose'; const shot=process.argv[3];
const b=await chromium.launch({channel:'chrome'}); const res=[];
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:'dark',locale:'en-US'}); const p=await c.newPage();
const check=async tag=>{ const r=await p.evaluate(()=>{const ov=document.getElementById('overview'); const morphs=document.querySelectorAll('.overview-morph').length;
  const vis=[...document.querySelectorAll(".overview-morph")].filter(m=>getComputedStyle(m).visibility!=="hidden").length;
  const bad=[...document.querySelectorAll('.overview-row .overview-card')].filter(e=>{const s=e.style;return (s.opacity&&s.opacity!=='1')||s.transform||e.classList.contains('is-focal')&&ov?.classList.contains('is-settled')&&false}).length;
  const rowsBad=[...document.querySelectorAll('.overview-row')].filter(r=>ov?.classList.contains('is-settled')&&getComputedStyle(r).translate!=='none'&&getComputedStyle(r).translate!=='0px'&&getComputedStyle(r).translate!=='0px 0px').length;
  return {open:!!ov,settled:ov?.classList.contains('is-settled'),morphs,vis,bad,rowsBad,stackHidden:document.querySelector('.swipe-stack')?.style.visibility||''}}); const fail=(r.settled&&r.vis)||r.vis||r.bad||r.rowsBad||(!r.open&&(r.morphs||r.stackHidden)); res.push((fail?'FAIL ':'PASS ')+tag+' '+JSON.stringify(r)); };
const W=ms=>p.waitForTimeout(ms);
await p.goto(U); await W(900);
await p.tap('#overview-open'); await W(1800); await check('open-settled'); if(shot) await p.screenshot({path:shot+'-settled.png'});
// drag immediately after open
await p.keyboard.press('Escape'); await W(1500); await check('closed');
await p.tap('#overview-open'); await W(120); 
await p.mouse.move(200,400); await p.mouse.down(); for(let i=0;i<8;i++){await p.mouse.move(200-i*20,400+i*10);await W(16);} await p.mouse.up(); await W(1800); await check('drag-during-open');
await p.mouse.move(200,400); await p.mouse.down(); for(let i=0;i<8;i++){await p.mouse.move(200-i*25,400);await W(16);} await p.mouse.up(); await W(1500); await check('after-drag');
if(shot) await p.screenshot({path:shot+'-afterdrag.png'});
// quick open/close interrupts
await p.keyboard.press('Escape'); await W(150); await p.tap('#overview-open').catch(()=>{}); await W(150); await p.keyboard.press('Escape'); await W(100); await p.tap('#overview-open').catch(()=>{}); await W(1800); await check('interrupted-reopen');
await p.goBack(); await W(1500); await check('back');
await p.tap('#overview-open'); await W(300); await p.goBack(); await W(80); await p.tap('#overview-open').catch(()=>{}); await W(1800); await check('back-mid-reopen');
if(shot) await p.screenshot({path:shot+'-reopen.png'});
await p.keyboard.press('Escape'); await W(1500); await check('final-closed');
console.log(res.join('\n')); await b.close();
