// Pre-render crawlable landing pages from the SSA JSON that scripts/build-data.mjs writes to public/data.
// Usage: node scripts/build-pages.mjs [outDir=dist]. Runs after `vite build`; writes dist/names/** and dist/sitemap.xml.
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ORIGIN = 'https://lexcao.io/English-name-picker/';
export const YEAR_FROM = 1950;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = n => n.toLocaleString('en-US');

/** Every page as { path, title, description, h1, intro, body }; path is relative to the tool root, ends with '/'. */
export function pages(load, meta) {
  const last = meta.years[1], cmp = last - 20, out = [];
  const g = (y, s) => load(y, s);
  const rankIn = (rows) => new Map(rows.map(r => [r.name, r.rank]));
  const table = (rows, extra) => `<table><thead><tr><th>排名</th><th>名字 Name</th><th>出生人数</th>${extra ? `<th>${extra.head}</th>` : ''}</tr></thead><tbody>${rows.map(r => `<tr><td>${r.rank}</td><td class="nm">${esc(r.name)}</td><td>${fmt(r.occurrences)}</td>${extra ? `<td>${extra.cell(r)}</td>` : ''}</tr>`).join('')}</tbody></table>`;
  for (const [sex, zh, en, slug] of [['female', '女生', 'girls', 'girls'], ['male', '男生', 'boys', 'boys']]) {
    const rows = g(last, sex).slice(0, 200), old = rankIn(g(cmp, sex));
    out.push({ path: `names/${slug}/`, title: `${zh}英文名：${last} 年美国最常见的 200 个${zh}英文名 | 同年名`,
      description: `${zh}英文名怎么取？这里是美国社保局（SSA）${last} 年出生婴儿中最常见的 200 个${zh}名字，附出生人数和 ${cmp} 年排名，可按出生年份继续挑选。`,
      h1: `${zh}英文名 · Popular ${en}' names`,
      intro: `下表是美国社保局（SSA）公布的 ${last} 年美国出生${zh === '女生' ? '女婴' : '男婴'}中最常见的 200 个名字，按出生人数排序；最后一列是同一名字在 ${cmp} 年的排名（“—”表示当年不在前 1,000 名）。数据只反映美国的使用频率，不代表含义或适合程度。<span lang="en">Top 200 ${en}' names in U.S. births, ${last} (SSA).</span>`,
      body: table(rows, { head: `${cmp} 排名`, cell: r => old.get(r.name) ?? '—' }) });
  }
  for (const L of LETTERS) {
    const pick = sex => g(last, sex).filter(r => r.name[0] === L).slice(0, 50);
    const f = pick('female'), m = pick('male');
    out.push({ path: `names/letter/${L.toLowerCase()}/`, title: `${L} 开头的英文名：${last} 年美国常见${L}字母男生、女生英文名 | 同年名`,
      description: `${L} 开头的英文名有哪些？按美国社保局（SSA）${last} 年数据，列出 ${L} 开头最常见的女生和男生英文名（各最多 50 个）及全国排名。`,
      h1: `${L} 开头的英文名 · Names starting with ${L}`,
      intro: `按中文名拼音首字母找英文名时，可以从这里开始。下表来自美国社保局（SSA）${last} 年出生数据前 1,000 名，排名为该名字在全国同性别中的名次。${f.length + m.length < 20 ? `${L} 开头的常见名字较少，前 1,000 名里共 ${f.length + m.length} 个。` : ''}<span lang="en">Names starting with ${L} in the ${last} SSA top 1,000.</span>`,
      body: `<div class="cols"><section><h2>女生 Girls</h2>${f.length ? table(f) : '<p>无 None</p>'}</section><section><h2>男生 Boys</h2>${m.length ? table(m) : '<p>无 None</p>'}</section></div>` });
  }
  for (let y = YEAR_FROM; y <= last; y++) {
    const f = g(y, 'female').slice(0, 100), m = g(y, 'male').slice(0, 100);
    out.push({ path: `names/year/${y}/`, title: `${y} 年出生的英文名：当年美国最常见的 100 个男生、女生名字 | 同年名`,
      description: `和你同年出生的英文名：美国社保局（SSA）${y} 年出生婴儿中最常见的女生名 ${f[0].name}、${f[1].name}，男生名 ${m[0].name}、${m[1].name} 等各 100 个，附出生人数。`,
      h1: `${y} 年出生的英文名 · Names born in ${y}`,
      intro: `如果你 ${y} 年出生，这些就是和你同龄的美国人最常见的名字。一个常见的取名思路是从自己出生那年的热门名字里挑，这样听起来更符合你的年龄。数据来自美国社保局（SSA），按出生人数排序。<span lang="en">The most common names given to U.S. babies born in ${y} (SSA).</span>`,
      body: `<div class="cols"><section><h2>女生 Girls</h2>${table(f)}</section><section><h2>男生 Boys</h2>${table(m)}</section></div>`, year: y });
  }
  out.push({ path: 'names/', title: `英文名大全：按出生年份、首字母、男生女生浏览英文名 | 同年名`,
    description: `取英文名的参考目录：按出生年份（${YEAR_FROM}–${last}）、首字母 A–Z、女生英文名、男生英文名浏览美国社保局（SSA）真实排名数据。`,
    h1: '英文名目录 · Browse names', intro: `所有页面都来自美国社保局（SSA）公开的出生婴儿名字数据（${meta.years[0]}–${last}，每年每性别前 1,000 名）。<span lang="en">All lists use U.S. SSA baby-name data.</span>`, body: '' });
  return out;
}

export function render(p, all, meta) {
  const depth = p.path.split('/').filter(Boolean).length, up = '../'.repeat(depth), url = ORIGIN + p.path;
  const years = all.filter(x => x.year), last = meta.years[1];
  const near = p.year ? years.filter(x => Math.abs(x.year - p.year) <= 3 && x.year !== p.year) : [];
  const nav = `<nav class="hub" aria-label="浏览英文名"><h2>继续浏览 More lists</h2>
<p><a href="${up}names/girls/">女生英文名</a> · <a href="${up}names/boys/">男生英文名</a> · <a href="${up}names/">全部目录</a></p>
${near.length ? `<p class="yr">相邻年份：${near.map(x => `<a href="${up}${x.path}">${x.year}</a>`).join(' ')}</p>` : ''}
<p class="az" aria-label="首字母">${LETTERS.map(L => `<a href="${up}names/letter/${L.toLowerCase()}/">${L}</a>`).join('')}</p>
<p class="yr">按出生年份：${years.filter(x => x.year % 5 === 0 || x.year === last).map(x => `<a href="${up}${x.path}">${x.year}</a>`).join(' ')}</p></nav>`;
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '同年名', item: ORIGIN }, { '@type': 'ListItem', position: 2, name: '英文名目录', item: ORIGIN + 'names/' }, ...(p.path === 'names/' ? [] : [{ '@type': 'ListItem', position: 3, name: p.h1.split(' · ')[0], item: url }])] };
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f3d30">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="zh" href="${url}"><link rel="alternate" hreflang="en" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<link rel="icon" type="image/svg+xml" href="${up}favicon.svg?v=2"><link rel="icon" type="image/png" sizes="32x32" href="${up}favicon-32.png?v=2"><link rel="apple-touch-icon" href="${up}apple-touch-icon.png?v=2">
<meta property="og:type" content="website"><meta property="og:site_name" content="同年名 · Name Vintage"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ORIGIN}og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${up}fonts/bricolage-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${up}names.css">
<script type="application/ld+json">${JSON.stringify(crumbs)}</script></head><body>
<header><a class="brand" href="${up}"><svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true"><rect x="16" y="6" width="36" height="46" rx="7" class="bk" transform="rotate(10 34 29)"/><rect x="10" y="12" width="36" height="46" rx="7" class="fr"/><path d="M19 47V35a6 6 0 0 1 12 0v12" class="n"/><circle cx="37" cy="45" r="3" class="bk"/></svg>同年名 <span>Name Vintage</span></a><a class="cta" href="${up}#/choose">开始挑名字 ↗</a></header>
<main><p class="crumb"><a href="${up}names/">英文名目录</a> / SSA ${meta.years[0]}–${last}</p><h1>${esc(p.h1.split(' · ')[0])}<span lang="en">${esc(p.h1.split(' · ')[1] ?? '')}</span></h1><p class="intro">${p.intro}</p>
${p.body}
<p class="go"><a class="cta" href="${up}#/choose">用你的出生年份，一张张翻名字 ↗</a> <a href="https://lexcao.io/zh/posts/choose-english-name/">怎么起英文名：5 个步骤</a></p>
${nav}</main>
<footer><p>数据：<a href="${esc(meta.url)}" rel="noopener">美国社保局 SSA 出生婴儿名字</a>（${meta.years[0]}–${last}，每年每性别前 1,000 名）。只反映美国出生登记中的使用频率，不含名字含义。</p></footer></body></html>
`;
}

export const CSS = `@font-face{font-family:"Bricolage Grotesque";src:url(fonts/bricolage-latin.woff2) format("woff2");font-weight:400 800;font-display:swap}
:root{--bg:#f4f1e8;--text:#1f3d30;--muted:#5f6f65;--line:#dcdccf;--accent:#1f3d30;--sage:#9db8a3;--panel:#fbfaf5;color-scheme:light dark;font-family:"Inter Tight","Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif}
@media(prefers-color-scheme:dark){:root{--bg:#16231d;--text:#e9e8dc;--muted:#a9b4a7;--line:#33433a;--accent:#b4c8a1;--sage:#5f7d68;--panel:#1c2b24}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);line-height:1.6}
a{color:inherit;text-underline-offset:3px;text-decoration-color:var(--sage)}a:hover{text-decoration-color:currentColor}
header{display:flex;justify-content:space-between;align-items:center;gap:16px;max-width:1080px;margin:0 auto;padding:22px 24px;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:10px;font-family:"Bricolage Grotesque","Noto Sans SC",sans-serif;font-weight:650;letter-spacing:-.02em;text-decoration:none}.brand span{color:var(--muted);font-weight:500}
.brand .bk{fill:var(--sage)}.brand .fr{fill:var(--accent)}.brand .n{fill:none;stroke:var(--bg);stroke-width:4.5;stroke-linecap:round}
.cta{display:inline-block;background:var(--accent);color:var(--bg);padding:10px 16px;font-size:.9rem;text-decoration:none;border-radius:4px;transition:transform .2s cubic-bezier(.2,.8,.2,1)}.cta:hover{transform:translateY(-1px)}
main{max-width:1080px;margin:0 auto;padding:32px 24px 48px}.crumb{font-size:.8rem;color:var(--muted);letter-spacing:.02em}
h1 span{display:block;font-size:.42em;letter-spacing:-.02em;color:var(--muted);margin-top:.35em;font-weight:600}h1{font-family:"Bricolage Grotesque","Noto Sans SC",sans-serif;font-size:clamp(2.1rem,6vw,4rem);line-height:1.05;letter-spacing:-.04em;margin:.3em 0 .4em;text-wrap:balance}
.intro{max-width:44em;color:var(--muted);font-size:1.02rem}.intro span{display:block;margin-top:.4em;font-size:.9rem}
h2{font-family:"Bricolage Grotesque","Noto Sans SC",sans-serif;font-size:1.25rem;letter-spacing:-.02em;margin:1.6em 0 .6em}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:32px}@media(max-width:720px){.cols{grid-template-columns:1fr;gap:8px}}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:.95rem;margin-top:16px}
th{white-space:nowrap;text-align:left;font-weight:500;font-size:.75rem;color:var(--muted);border-bottom:1px solid var(--text);padding:8px 6px}
td{border-bottom:1px solid var(--line);padding:7px 6px}td:first-child{color:var(--muted);width:4.5em}td.nm{font-family:"Bricolage Grotesque",sans-serif;font-weight:600;font-size:1.08rem;letter-spacing:-.01em}
th:nth-child(n+3),td:nth-child(n+3){text-align:right}tbody tr:hover{background:var(--panel)}
.go{margin:40px 0;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.hub{border-top:1px solid var(--line);margin-top:24px}.az{display:flex;flex-wrap:wrap;gap:4px}.az a{display:inline-grid;place-items:center;width:36px;height:36px;border:1px solid var(--line);border-radius:4px;text-decoration:none;font-family:"Bricolage Grotesque",sans-serif}.az a:hover{border-color:var(--text)}
.yr{line-height:2.1;word-spacing:4px}.yr a{white-space:nowrap}
footer{max-width:1080px;margin:0 auto;padding:24px;border-top:1px solid var(--line);font-size:.8rem;color:var(--muted)}
@media(prefers-reduced-motion:reduce){.cta{transition:none}}
`;

export function sitemap(all) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', ...all.map(p => p.path)].map(p => `<url><loc>${ORIGIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url)), out = resolve(root, process.argv[2] ?? 'dist');
  const data = resolve(root, 'public/data');
  const meta = JSON.parse(await readFile(resolve(data, 'meta.json'), 'utf8'));
  const cache = new Map();
  for (let y = YEAR_FROM - 0; y <= meta.years[1]; y++) for (const s of ['female', 'male']) cache.set(`${y}-${s}`, JSON.parse(await readFile(resolve(data, `${y}-${s}.json`), 'utf8')));
  const all = pages((y, s) => cache.get(`${y}-${s}`), meta);
  const hub = all.find(p => p.path === 'names/');
  hub.body = `<h2>女生 / 男生</h2><p><a href="girls/">女生英文名</a> · <a href="boys/">男生英文名</a></p><h2>按首字母</h2><p class="az">${LETTERS.map(L => `<a href="letter/${L.toLowerCase()}/">${L}</a>`).join('')}</p><h2>按出生年份</h2><p class="yr">${all.filter(p => p.year).map(p => `<a href="year/${p.year}/">${p.year}</a>`).join(' ')}</p>`;
  await rm(resolve(out, 'names'), { recursive: true, force: true });
  for (const p of all) { const f = resolve(out, p.path, 'index.html'); await mkdir(dirname(f), { recursive: true }); await writeFile(f, render(p, all, meta)); }
  await writeFile(resolve(out, 'names.css'), CSS);
  await writeFile(resolve(out, 'sitemap.xml'), sitemap(all));
  console.log(`Generated ${all.length} landing pages + sitemap.xml`);
}
