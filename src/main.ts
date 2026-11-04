import { buildRows, rowDuration, lerp, smoothstep, springStep } from './overview';
import './styles.css';
import { startOverviewCanvas } from './overview-canvas';
type Person = {
    name: string;
    gender: 'male' | 'female';
    occurrences: number;
    rank: number;
};
type Meta = {
    years: [
        number,
        number
    ];
    source: string;
    url: string;
};
const messages = {
    en: {
        brand: 'English Name Picker', home: 'Home', choose: 'Pick a name', browser: 'Browse names', check: 'Social handles',
        eyebrow: 'A NEW NAME. STILL YOU.', title: 'Find a name that feels like you.', intro: 'A little inspiration from generations of names. Find your favorites, hear them aloud, and make one your own.',
        method: 'Your name, in three small steps', one: 'Start with your birth year', oneText: 'Explore popular names from your generation.', two: 'Find a familiar sound', twoText: 'Try the first letter or a sound close to your real name.', three: 'Say it out loud', threeText: 'Listen, introduce yourself, and save the names that feel right.',
        year: 'Birth year', gender: 'Name category', male: 'Male', female: 'Female', query: 'Explore names', initial: 'Starts with', all: 'All',
        results: 'The possibilities', selected: 'Your shortlist', empty: 'Tap a name to add it to your shortlist.', none: 'No names match this letter. Try another.', more: 'Load more', reset: 'Reset',
        hearIt: 'Hear it', speech: 'Voice settings', enabled: 'Read names when selected', language: 'Speech language', voice: 'Voice', defaultVoice: 'Browser default', unsupported: 'Speech is unavailable in this browser.', noVoices: 'No installed voices yet. Your browser will try its default voice.',
        listen: 'Listen to', remove: 'Remove', rank: 'Rank', name: 'Name', count: 'Births', prev: 'Previous', next: 'Next', loading: 'Loading names…', error: 'Could not load local name data. Please try again.', retry: 'Try again',
        handleStep1: 'Type the handle you want, for example your English name + surname (alexchen).', handleStep2: 'Click “Check handle” to get profile links for each platform.', handleStep3: 'Open each link. If a profile page appears, the handle is taken. If it shows “not found”, it may be available; confirm on the platform’s sign-up page.', quickFill: 'Use a shortlisted name', handle: 'Try a social handle', handleHelp: 'Open a profile to check manually. A missing profile does not guarantee a handle is available; confirm on the platform.', handleLabel: 'Username', open: 'Open profile', invalid: 'Use 1–30 letters, numbers, underscores, or periods.', checkName: 'Check handle', saved: 'selected', data: 'Data: SSA, years', about: 'Top 1,000 names per year and category · National U.S. birth records', back: 'Back to names',
    },
    zh: {
        brand: '英文名挑选器', home: '首页', choose: '挑选名字', browser: '浏览名字', check: '社交账号',
        eyebrow: '新的名字，熟悉的自己。', title: '找到一个，像你的名字。', intro: '从几代人的名字中寻找灵感。收藏喜欢的名字，听听发音，找到属于你的那一个。',
        method: '三个小步骤，找到你的英文名', one: '从出生年份开始', oneText: '看看与你同龄的人常用哪些名字。', two: '寻找熟悉的声音', twoText: '试试与你本名相近的发音或首字母。', three: '大声说出来', threeText: '听听发音，试着介绍自己，留下感觉自然的名字。',
        year: '出生年份', gender: '名字类别', male: '男性', female: '女性', query: '探索名字', initial: '首字母', all: '全部',
        results: '名字灵感', selected: '我的候选名单', empty: '点击名字，将它加入候选名单。', none: '没有匹配的名字，请试试其他字母。', more: '加载更多', reset: '重置',
        hearIt: '听发音', speech: '发音设置', enabled: '选中名字时朗读', language: '朗读语言', voice: '朗读声音', defaultVoice: '浏览器默认', unsupported: '此浏览器不支持语音朗读。', noVoices: '暂无已安装的声音，浏览器将尝试默认声音。',
        listen: '朗读', remove: '移除', rank: '排名', name: '名字', count: '出生人数', prev: '上一页', next: '下一页', loading: '正在加载名字…', error: '无法加载本地名字数据，请重试。', retry: '重试',
        handleStep1: '输入你想要的账号名，例如英文名 + 姓氏（alexchen）。', handleStep2: '点击“查看账号名”按钮，获取各个平台的个人主页链接。', handleStep3: '逐个打开链接：如果出现个人主页，说明账号名已被占用；如果显示“未找到”，则可能可用，但仍需在该平台的注册页面确认。', quickFill: '使用候选名单中的名字', handle: '试试社交账号名', handleHelp: '打开个人主页手动查看。主页不存在并不代表账号名可用，请在对应平台确认。', handleLabel: '账号名', open: '打开主页', invalid: '请输入 1–30 个字母、数字、下划线或句点。', checkName: '查看账号名', saved: '个已选', data: 'Data: SSA, years', about: '每年每类别前 1,000 名 · 美国全国出生记录', back: '返回名字列表',
    }
};
function read(key: string) { try {
    return localStorage.getItem(key);
}
catch {
    return null;
} }
function save(key: string, value: string) { try {
    localStorage.setItem(key, value);
}
catch { /* Storage can be disabled. */ } }
let locale: 'en' | 'zh' = read('locale') === 'en' ? 'en' : read('locale') === 'zh' ? 'zh' : navigator.language.startsWith('zh') ? 'zh' : 'en';
let meta: Meta;
let year = 2025;
let gender: Person['gender'] = 'male';
let initial = '';
let visible = 100;
let page = 0;
let rows: Person[] = [];
let loading = false;
let failed = false;
let requestId = 0;
const selected = new Map<string, Person>();
try {
    const stored: unknown = JSON.parse(read('shortlist') ?? '[]');
    if (Array.isArray(stored)) {
        for (const person of stored) {
            if (person && typeof person.name === 'string' && person.name.trim() &&
                (person.gender === 'male' || person.gender === 'female') &&
                Number.isInteger(person.rank) && person.rank > 0 &&
                Number.isInteger(person.occurrences) && person.occurrences >= 0) {
                selected.set(person.name, { name: person.name, gender: person.gender, rank: person.rank, occurrences: person.occurrences });
            }
        }
    }
} catch { /* Ignore malformed saved shortlists. */ }
function saveShortlist() {
    save('shortlist', JSON.stringify([...selected.values()]));
}
let loadedKey = '';
function ensureNames() {
    if (meta && ['choose', 'browser'].includes(route()) && loadedKey !== `${year}-${gender}`)
        void load();
}
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];
let speechEnabled = false;
let speechLang = 'en-US';
let voiceURI = '';
let handle = '';
let shortlistOnly = false;
let speechOpen = false;
const app = document.querySelector<HTMLDivElement>('#app')!;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function route() { const value = location.hash.replace(/^#\/?/, ''); return ['choose', 'browser', 'check'].includes(value) ? value : ''; }
function speak(name: string) {
    if (!synth)
        return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.lang = speechLang;
    utterance.voice = voices.find(v => v.voiceURI === voiceURI) ?? null;
    synth.speak(utterance);
}
async function json<T>(path: string): Promise<T> {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
    if (!response.ok)
        throw new Error(`${response.status}: ${path}`);
    return response.json();
}
async function load() {
    const id = ++requestId;
    loadedKey = `${year}-${gender}`;
    loading = true;
    failed = false;
    rows = [];
    visible = 100;
    page = 0;
    render();
    try {
        const data = await json<Person[]>(`data/${year}-${gender}.json`);
        if (id === requestId)
            rows = data;
    }
    catch {
        if (id === requestId) {
            failed = true;
            loadedKey = '';
        }
    }
    finally {
        if (id === requestId) {
            loading = false;
            render();
        }
    }
}
function speechSettings() {
    const t = messages[locale];
    if (!synth)
        return `<details class="speech" ${speechOpen ? 'open' : ''}><summary>${t.speech}</summary><p>${t.unsupported}</p></details>`;
    const langs = [...new Set([speechLang, ...voices.map(v => v.lang)])].sort();
    return `<details class="speech" ${speechOpen ? 'open' : ''}><summary>${t.speech}</summary><div class="speech-fields"><label class="toggle"><input id="speech-enabled" type="checkbox" ${speechEnabled ? 'checked' : ''}>${t.enabled}</label><label>${t.language}<select id="speech-lang">${langs.map(l => `<option ${l === speechLang ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label><label>${t.voice}<select id="speech-voice"><option value="">${t.defaultVoice}</option>${voices.filter(v => v.lang === speechLang).map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === voiceURI ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label></div>${!voices.length ? `<p>${t.noVoices}</p>` : ''}</details>`;
}
function form() {
    const t = messages[locale];
    return `<form id="query" class="query"><label>${t.year}<input name="year" type="number" required step="1" min="${meta.years[0]}" max="${meta.years[1]}" value="${year}" list="years"><datalist id="years">${Array.from({ length: meta.years[1] - meta.years[0] + 1 }, (_, i) => `<option value="${meta.years[1] - i}"></option>`).join('')}</datalist><small>${meta.years[0]}–${meta.years[1]}</small></label><fieldset><legend>${t.gender}</legend><div class="segmented">${(['male', 'female'] as const).map(g => `<label><input type="radio" name="gender" value="${g}" ${gender === g ? 'checked' : ''}><span>${t[g]}</span></label>`).join('')}</div></fieldset><button class="primary" type="submit">${t.query} <span aria-hidden="true">↗</span></button></form>`;
}
function shortlist() {
    const t = messages[locale];
    return `<aside class="panel shortlist"><div class="section-heading"><h2>${t.selected}</h2><span class="badge">${selected.size}</span></div>${selected.size ? `<ul>${[...selected.values()].map(p => `<li><button class="name-speak" data-speak="${esc(p.name)}" aria-label="${t.listen} ${esc(p.name)}">${esc(p.name)} <span aria-hidden="true">♪</span></button><div><button class="icon-button" data-handle="${esc(p.name)}" aria-label="${t.checkName}: ${esc(p.name)}">↗</button><button class="icon-button" data-remove="${esc(p.name)}" aria-label="${t.remove} ${esc(p.name)}">×</button></div></li>`).join('')}</ul>` : `<p class="muted">${t.empty}</p>`}</aside>`;
}
function results(browse: boolean) {
    const t = messages[locale];
    if (loading)
        return `<p role="status" class="status">${t.loading}</p>`;
    if (failed)
        return `<p role="alert">${t.error}</p><button id="retry">${t.retry}</button>`;
    const filtered = rows.filter(p => p.name.startsWith(initial));
    if (!filtered.length)
        return `<p class="status">${t.none}</p>`;
    if (browse) {
        const pages = Math.ceil(filtered.length / 10);
        return `<div class="table-scroll"><table><thead><tr><th>${t.rank}</th><th>${t.name}</th><th>${t.gender}</th><th>${t.count}</th></tr></thead><tbody>${filtered.slice(page * 10, page * 10 + 10).map(p => `<tr><td>${p.rank}</td><td><button data-select="${p.name}" aria-pressed="${selected.has(p.name)}">${p.name} ${selected.has(p.name) ? '✓' : '+'}</button></td><td>${t[p.gender]}</td><td>${p.occurrences.toLocaleString(locale)}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><button id="first" ${page === 0 ? 'disabled' : ''} aria-label="${t.prev} 1">«</button><button id="prev" ${page === 0 ? 'disabled' : ''}>${t.prev}</button><span>${page + 1} / ${pages}</span><button id="next" ${page + 1 >= pages ? 'disabled' : ''}>${t.next}</button><button id="last" ${page + 1 >= pages ? 'disabled' : ''} aria-label="${t.next} ${pages}">»</button></div>`;
    }
    return `<div class="name-grid">${filtered.slice(0, visible).map(p => `<button class="name-card ${selected.has(p.name) ? 'is-selected' : ''}" data-select="${p.name}" aria-pressed="${selected.has(p.name)}"><span class="name-rank">#${p.rank}</span><strong>${p.name}</strong><span class="name-mark" aria-hidden="true">${selected.has(p.name) ? '✓' : '+'}</span></button>`).join('')}</div><button class="load-more" id="more" ${visible >= filtered.length ? 'disabled' : ''}>${t.more} · ${Math.min(visible, filtered.length)} / ${filtered.length}</button>`;
}
const swipeMessages = {
    en: { hint: 'Your pinyin initial', order: 'Order', rankOrder: 'By rank', shuffle: 'Shuffle', keep: 'Keep', skip: 'Skip', undo: 'Undo', filters: 'Filters', play: 'Hear it', guide: 'Swipe left to skip, right to keep.', keys: '← Skip · → Keep · Space Listen · U Undo', end: 'A little closer to your name.', kept: 'Names kept this round', review: 'Review shortlist', restart: 'Restart', empty: 'Keep a name you love. It will be waiting here.', occurrences: 'births', remaining: 'names remaining', byRank: 'By popularity', shuffled: 'Shuffled', overview: 'Overview', overviewTitle: 'All names at a glance', overviewHint: 'Drag to explore · click a name to open it', back: 'Back to stack', ovBirths: 'births' },
    zh: { hint: '你中文名拼音的首字母', order: '排序', rankOrder: '按排名', shuffle: '随机', keep: '收藏', skip: '跳过', undo: '撤销', filters: '筛选', play: '听发音', guide: '一次认识一个名字。向左跳过，向右收藏。', keys: '← 跳过 · → 收藏 · 空格 发音 · U 撤销', end: '离你的名字，又近了一步。', kept: '本轮收藏的名字', review: '查看候选名单', restart: '重新开始', empty: '收藏一个心动的名字，让它在这里等你。', occurrences: '人使用', remaining: '个名字待探索', byRank: '按热度排列', shuffled: '随机排列', overview: '全部浏览', overviewTitle: '一眼看完所有名字', overviewHint: '拖动浏览 · 点击名字查看', back: '返回卡片', ovBirths: '人' }
};
let chooseFiltersOpen = false;
let chooseInitial = /^[A-Z]$/.test(read('choose-initial') ?? '') ? read('choose-initial')! : '';
let chooseOrder = read('choose-order') === 'shuffle' ? 'shuffle' : 'rank';
let deckRows: Person[] = [];
let deckSource: Person[] | null = null;
let decisions: { person: Person; keep: boolean }[] = [];
let deciding = false;
let pinned: string | null = null;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function resetDeck() {
    decisions = [];
    pinned = null;
    deckRows = [...rows].sort((a, b) => a.rank - b.rank);
    if (chooseOrder === 'shuffle') {
        for (let i = deckRows.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deckRows[i], deckRows[j]] = [deckRows[j], deckRows[i]];
        }
    }
    deckSource = rows;
}
function availableCards() {
    if (deckSource !== rows) resetDeck();
    const done = new Set(decisions.map(d => d.person.name));
    const list = deckRows.filter(p => p.name.startsWith(chooseInitial) && !selected.has(p.name) && !done.has(p.name) && p.name !== pinned);
    const pin = pinned ? deckRows.find(p => p.name === pinned) : undefined;
    return pin ? [pin, ...list] : list;
}
function choosePage() {
    const t = messages[locale], w = swipeMessages[locale];
    const cards = availableCards();
    return `<section class="choose-page"><div class="page-title"><div><h1>${t.choose}</h1></div></div><p class="muted guidance">${w.guide}</p>
    <div class="choose-filter-panel panel"><button type="button" id="choose-filters-toggle" aria-expanded="${chooseFiltersOpen}" aria-controls="choose-filters"><strong>${w.filters}</strong><span>${year} · ${t[gender]} · ${chooseInitial || t.all} · ${chooseOrder === 'rank' ? w.rankOrder : w.shuffle}</span><span aria-hidden="true">${chooseFiltersOpen ? '−' : '+'}</span></button><div id="choose-filters" class="choose-controls ${chooseFiltersOpen ? 'is-open' : ''}"><label>${t.year}<input id="choose-year" type="number" min="${meta.years[0]}" max="${meta.years[1]}" step="1" value="${year}"></label><fieldset><legend>${t.gender}</legend><div class="segmented">${(['male', 'female'] as const).map(g => `<label><input type="radio" name="choose-gender" value="${g}" ${gender === g ? 'checked' : ''}><span>${t[g]}</span></label>`).join('')}</div></fieldset><label class="initial-control">${t.initial}<select id="choose-initial" title="${w.hint}">${['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<option value="${l}" ${chooseInitial === l ? 'selected' : ''}>${l || t.all}</option>`).join('')}</select></label><label>${w.order}<select id="choose-order"><option value="rank" ${chooseOrder === 'rank' ? 'selected' : ''}>${w.rankOrder}</option><option value="shuffle" ${chooseOrder === 'shuffle' ? 'selected' : ''}>${w.shuffle}</option></select></label></div></div>
    <div class="workspace swipe-workspace"><section class="swipe-stage" aria-label="${t.results}">${loading ? `<p class="status" role="status">${t.loading}</p>` : failed ? `<p role="alert">${t.error}</p><button id="retry">${t.retry}</button>` : cards.length ? `<div class="deck-meta"><span>${chooseOrder === 'rank' ? w.byRank : w.shuffled}</span><span>${cards.length} ${w.remaining}</span><button type="button" id="overview-open" class="overview-open"><span aria-hidden="true">▦</span> ${w.overview}</button></div><div class="swipe-stack">${cards.slice(0, 4).map((p, i) => `<article class="swipe-card ${i === 0 ? 'is-top' : 'is-behind'}" data-name="${esc(p.name)}" style="--depth:${i};z-index:${4 - i}" ${i ? 'aria-hidden="true" inert' : ''}><div class="card-topline"><span>${locale === 'zh' ? `${year} 年排名第 ${p.rank}` : `Rank #${p.rank} in ${year}`}</span><span>${t[p.gender]}</span></div><span class="stamp-keep" aria-hidden="true">${w.keep}</span><span class="stamp-skip" aria-hidden="true">${w.skip}</span><h2>${esc(p.name)}</h2><p class="card-occurrences">${p.occurrences.toLocaleString(locale)} ${w.occurrences}</p><button class="card-pronounce" data-speak="${esc(p.name)}" ${i ? 'tabindex="-1"' : ''} aria-label="${t.listen} ${esc(p.name)}">♪ <span>${t.hearIt}</span></button><div class="card-rule" aria-hidden="true">n.</div></article>`).join('')}</div>` : `<div id="deck-end" class="panel" role="status"><p class="eyebrow">${t.results}</p><h2>${w.end}</h2><p>${w.kept}: <strong>${decisions.filter(d => d.keep && selected.has(d.person.name)).length}</strong></p><button id="review-shortlist">${w.review}</button><button id="restart" class="primary">${w.restart}</button></div>`}
    <div class="swipe-actions"><button id="skip" ${!cards.length || loading || failed ? 'disabled' : ''}>← ${w.skip}</button><button id="play" ${!cards.length || loading || failed || !synth ? 'disabled' : ''}>♪ ${w.play}</button><button id="keep" class="primary" ${!cards.length || loading || failed ? 'disabled' : ''}>${w.keep} ♡</button><button id="undo" class="swipe-undo" ${!decisions.length ? 'disabled' : ''}>↶ ${w.undo}</button></div><p class="swipe-keys muted">${w.keys}</p></section><div id="choose-shortlist" tabindex="-1">${shortlist().replace(t.empty, w.empty)}${speechSettings()}</div></div></section>`;
}
let overviewEl: HTMLElement | null = null;
let overviewCanvas: ReturnType<typeof startOverviewCanvas> | undefined;
let camera: { p: number; velocity: number; target: number; frame: number; last: number; focal: HTMLElement; morph: HTMLElement; cx: number; cy: number; tx: number; ty: number; s0: number; width: number; height: number; sx: number; sy: number } | undefined;
let hintTimer = 0;
function visibleOverviewCard(el: HTMLElement, name?: string): HTMLElement {
    const cards = [...el.querySelectorAll<HTMLElement>('.overview-card')];
    const matches = cards.filter(card => card.dataset.name === name);
    return (matches.length ? matches : cards).sort((a, b) => {
        const distance = (card: HTMLElement) => { const r = card.getBoundingClientRect(); return Math.hypot(r.x + r.width / 2 - innerWidth / 2, r.y + r.height / 2 - innerHeight / 2); };
        return distance(a) - distance(b);
    })[0];
}
function hideDragHint() {
    clearTimeout(hintTimer);
    overviewEl?.querySelector<HTMLElement>('.overview-drag-hint')?.classList.remove('is-visible');
}
function measureCamera(focal: HTMLElement) {
    const el = overviewEl!, plane = el.querySelector<HTMLElement>('.overview-plane')!;
    const top = document.querySelector<HTMLElement>('.swipe-card.is-top')!;
    camera?.morph.remove(); camera?.focal.classList.remove('is-focal'); if (camera) camera.focal.style.opacity = '';
    // Measure both endpoints at rest. These temporary writes are restored before paint.
    const main = document.querySelector<HTMLElement>('main')!;
    main.style.transform = ''; main.style.opacity = '';
    const S = top.getBoundingClientRect();
    plane.style.transform = 'scale(1)';
    const P = plane.getBoundingClientRect(), C = focal.getBoundingClientRect();
    const cx = C.x + C.width / 2 - P.x - P.width / 2, cy = C.y + C.height / 2 - P.y - P.height / 2;
    const s0 = S.width / C.width;
    const morph = document.createElement('div');
    const face = top.cloneNode(true) as HTMLElement;
    Object.assign(face.style, { position: 'absolute', inset: '0 auto auto 0', margin: '0', width: `${S.width}px`, height: `${S.height}px`, maxWidth: 'none', transform: `scale(${1/s0})`, transformOrigin: '0 0', visibility: 'visible' });
    morph.append(face);
    morph.classList.add('overview-morph'); morph.inert = true; morph.setAttribute('aria-hidden', 'true');
    Object.assign(morph.style, { left: `${P.width / 2 + cx}px`, top: `${P.height / 2 + cy}px`, width: `${S.width / s0}px`, height: `${S.height / s0}px` });
    plane.append(morph); focal.classList.add('is-focal');
    const old = camera;
    camera = { p: old?.p ?? 0, velocity: old?.velocity ?? 0, target: old?.target ?? 1, frame: old?.frame ?? 0, last: performance.now(), focal, morph, cx, cy,
        tx: S.x + S.width / 2 - (P.x + P.width / 2) - s0 * cx,
        ty: S.y + S.height / 2 - (P.y + P.height / 2) - s0 * cy,
        s0, width: C.width, height: C.height, sx: C.width / (S.width / s0), sy: C.height / (S.height / s0) };
    top.closest<HTMLElement>('.swipe-stack')!.style.visibility = reducedMotion() ? '' : 'hidden';
}
function drawCamera() {
    if (!camera || !overviewEl) return;
    const c = camera, p = c.p, reduced = reducedMotion();
    const plane = overviewEl.querySelector<HTMLElement>('.overview-plane')!;
    plane.style.transform = reduced ? '' : `translate(${c.tx * (1-p)}px,${c.ty * (1-p)}px) rotateX(${18*p}deg) rotateZ(${-22*p}deg) scale(${lerp(c.s0, innerWidth < 600 ? 1.25 : 1.45, p)})`;
    overviewEl.style.opacity = reduced ? String(p) : '1';
    const fade = reduced ? 1 : smoothstep(0, .5, p);
    overviewEl.querySelector<HTMLElement>('.overview-background')!.style.opacity = String(fade);
    overviewEl.querySelector<HTMLElement>('.overview-bar')!.style.opacity = String(fade);
    overviewEl.style.setProperty('--wall-opacity', String(reduced ? 1 : smoothstep(.05, .6, p)));
    const morph = smoothstep(0, .6, p);
    // Hand-off: the stack face fades before the tile face appears, so the two layouts never double-expose.
    c.morph.style.opacity = reduced ? '0' : String(1-smoothstep(.12, .42, p));
    c.focal.style.opacity = reduced ? '' : String(smoothstep(.3, .55, p));
    c.morph.style.transform = `translate(-50%,-50%) scale(${lerp(1,c.sx,morph)},${lerp(1,c.sy,morph)})`;
    const main = document.querySelector<HTMLElement>('main')!;
    main.style.transform = reduced ? '' : `scale(${1-.04*p})`; main.style.opacity = String(1-.6*p);
}
function runCamera() {
    if (!camera || camera.frame) return;
    camera.last = performance.now();
    const tick = (now: number) => {
        const c = camera; if (!c || !overviewEl) return;
        const dt = Math.min(.05, (now-c.last)/1000); c.last = now;
        if (reducedMotion()) { c.p += Math.sign(c.target-c.p)*Math.min(Math.abs(c.target-c.p),dt/.2); c.velocity=0; }
        else { const step = springStep(c.p,c.velocity,c.target,dt); c.p=step.position; c.velocity=step.velocity; }
        const settled = Math.abs(c.p-c.target)<.002 && Math.abs(c.velocity)<.025;
        if (settled) { c.p=c.target; c.velocity=0; }
        drawCamera();
        overviewEl.classList.toggle('is-settled', settled && c.target === 1);
        if (!settled) { c.frame=requestAnimationFrame(tick); return; }
        c.frame=0;
        if (c.target===0) {
            overviewCanvas?.stop(); overviewCanvas=undefined; overviewEl.remove(); overviewEl=null; camera=undefined;
            document.body.classList.remove('overview-lock');
            document.querySelectorAll<HTMLElement>('main,.swipe-stack').forEach(node => { node.style.transform=''; node.style.opacity=''; node.style.visibility=''; });
            document.getElementById('overview-open')?.focus();
        } else {
            overviewCanvas?.setActive(true);
            if (read('overviewDragHint')!=='1') {
                overviewEl.querySelector<HTMLElement>('.overview-drag-hint')!.classList.add('is-visible');
                overviewCanvas?.nudge(); hintTimer=window.setTimeout(hideDragHint,3500);
            }
        }
    };
    camera.frame=requestAnimationFrame(tick);
}
function overviewNames() {
    if (deckSource !== rows) resetDeck();
    return deckRows.filter(p => p.name.startsWith(chooseInitial));
}
function openOverview() {
    const names = overviewNames();
    if (overviewEl && camera) { camera.target=1; overviewCanvas?.setActive(false); runCamera(); return; }
    if (!names.length) return;
    const w = swipeMessages[locale], mobile = window.innerWidth < 600;
    const span = Math.hypot(innerWidth, innerHeight) * 3;
    const perRow = Math.max(mobile ? 10 : 14, Math.ceil(span / (mobile ? 212 : 254)));
    const topName = availableCards()[0]?.name;
    const start = names.findIndex(p => p.name === topName);
    const ordered = start > 0 ? [...names.slice(start), ...names.slice(0,start)] : names;
    const grid = buildRows(ordered, Math.max(12, Math.ceil(span / 110)), perRow);
    const top = document.querySelector<HTMLElement>('.swipe-card.is-top');
    const card = (p: Person) => `<button type="button" class="overview-card${p.name.length > 9 ? ' is-long' : ''}" data-name="${esc(p.name)}"><strong>${esc(p.name)}${selected.has(p.name) ? '<span class="overview-star" aria-label="★">★</span>' : ''}</strong><small>${locale === 'zh' ? `${year} 年第 ${p.rank} 名 · ${p.occurrences.toLocaleString(locale)} ${w.ovBirths}` : `#${p.rank} in ${year} · ${p.occurrences.toLocaleString(locale)} ${w.ovBirths}`}</small></button>`;
    const el = document.createElement('div');
    el.id = 'overview'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', w.overviewTitle);
    el.innerHTML = `<div class="overview-background"></div><div class="overview-drag-hint"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 12V5a2 2 0 0 1 4 0v6-3a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v6c0 4-3 6-7 6-2 0-4-1-5-3l-4-6a2 2 0 0 1 3-2l2 2"/></svg>${locale === 'zh' ? '拖动浏览' : 'Drag to explore'}</div><div class="overview-bar"><div><h2>${w.overviewTitle}</h2><p>${year} · ${messages[locale][gender]}${chooseInitial ? ` · ${chooseInitial}` : ''} · ${w.overviewHint}</p></div><button type="button" id="overview-close">← ${w.back}</button></div><div class="overview-stage"><div class="overview-plane" style="--per:${perRow}">${grid.map((row, r) => `<div class="overview-row ${r % 2 ? 'is-alt' : ''}" style="--dur:${rowDuration(r)}s"><div class="overview-track"><div class="overview-set">${row.map(card).join('')}</div><div class="overview-set" aria-hidden="true">${row.map(card).join('')}</div><div class="overview-set" aria-hidden="true">${row.map(card).join('')}</div></div></div>`).join('')}</div></div>`;
    el.querySelectorAll<HTMLElement>('.overview-set[aria-hidden] button').forEach(b => b.tabIndex = -1);
    document.body.append(el);
    document.body.classList.add('overview-lock');
    overviewEl = el;
    overviewCanvas = startOverviewCanvas(el, reducedMotion(), () => { save('overviewDragHint','1'); hideDragHint(); });
    // Bring an instance of the top name to the screen centre before measuring, so the camera pulls straight back from it.
    {
        const plane = el.querySelector<HTMLElement>('.overview-plane')!, prev = plane.style.transform;
        plane.style.transform = 'none';
        const P = plane.getBoundingClientRect(), C = visibleOverviewCard(el, top?.dataset.name).getBoundingClientRect();
        overviewCanvas.panBy(P.x + P.width / 2 - C.x - C.width / 2, P.y + P.height / 2 - C.y - C.height / 2);
        plane.style.transform = prev;
    }
    measureCamera(visibleOverviewCard(el, top?.dataset.name));
    drawCamera(); runCamera();
    el.querySelector<HTMLElement>('#overview-close')!.onclick = () => closeOverview();
    el.onclick = e => { const b = (e.target as HTMLElement).closest<HTMLElement>('.overview-card'); if (b) closeOverview(b.dataset.name!, b); };
    el.querySelector<HTMLElement>('#overview-close')!.focus();
}
function closeOverview(name?: string, clicked?: HTMLElement) {
    if (!overviewEl || !camera) return;
    hideDragHint(); overviewCanvas?.setActive(false); overviewEl.classList.remove('is-settled');
    if (camera.target === 0) return;
    // Mid-flight reversal keeps the same geometry, position and velocity.
    if (camera.p === 1 || name) {
        const focal = clicked ?? visibleOverviewCard(overviewEl, availableCards()[0]?.name);
        if (name) { pinned=name; decisions=decisions.filter(d => d.person.name!==name); render(); }
        measureCamera(focal);
    }
    camera.target=0; drawCamera(); runCamera();
}
function decide(keep: boolean) {
    if (deciding || loading || failed || route() !== 'choose') return;
    const person = availableCards()[0];
    const card = document.querySelector<HTMLElement>('.swipe-card.is-top');
    if (!person || !card) return;
    deciding = true;
    decisions.push({ person, keep });
    if (person.name === pinned) pinned = null;
    if (keep) {
        selected.set(person.name, person);
        saveShortlist();
        if (speechEnabled) speak(person.name);
    }
    if (reducedMotion()) { render(); return; }
    card.style.transition = 'transform 340ms ease-in, opacity 340ms ease-in';
    card.querySelector<HTMLElement>(keep ? '.stamp-keep' : '.stamp-skip')!.style.opacity = '1';
    if (keep) {
        const target = document.getElementById('choose-shortlist')!.getBoundingClientRect();
        const rect = card.getBoundingClientRect();
        card.style.transform = `translate(${target.x + target.width / 2 - rect.x - rect.width / 2}px, ${target.y - rect.y + 30}px) scale(.15) rotate(12deg)`;
    } else card.style.transform = `translate(${-window.innerWidth}px, 60px) rotate(-24deg)`;
    card.style.opacity = '0';
    window.setTimeout(() => { if (card.isConnected) render(); }, 350);
}
function undoDecision() {
    if (route() !== 'choose') return;
    const last = decisions.pop();
    if (!last) return;
    if (last.keep) { selected.delete(last.person.name); saveShortlist(); }
    render();
}
function bindSwipe() {
    document.getElementById('choose-filters-toggle')?.addEventListener('click', () => {
        chooseFiltersOpen = !chooseFiltersOpen;
        document.getElementById('choose-filters-toggle')!.setAttribute('aria-expanded', String(chooseFiltersOpen));
        document.getElementById('choose-filters-toggle')!.lastElementChild!.textContent = chooseFiltersOpen ? '−' : '+';
        document.getElementById('choose-filters')!.classList.toggle('is-open', chooseFiltersOpen);
    });
    document.getElementById('overview-open')?.addEventListener('click', openOverview);
    document.getElementById('skip')?.addEventListener('click', () => decide(false));
    document.getElementById('keep')?.addEventListener('click', () => decide(true));
    document.getElementById('undo')?.addEventListener('click', undoDecision);
    document.getElementById('play')?.addEventListener('click', () => { const p = availableCards()[0]; if (p) speak(p.name); });
    document.getElementById('restart')?.addEventListener('click', () => { resetDeck(); render(); });
    document.getElementById('review-shortlist')?.addEventListener('click', () => { const target = document.getElementById('choose-shortlist')!; target.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' }); target.focus({ preventScroll: true }); });
    document.getElementById('choose-year')?.addEventListener('change', e => {
        const input = e.target as HTMLInputElement;
        if (!input.checkValidity()) { input.reportValidity(); return; }
        year = Number(input.value); void load();
    });
    document.querySelectorAll<HTMLInputElement>('[name="choose-gender"]').forEach(input => input.onchange = () => { gender = input.value as Person['gender']; void load(); });
    document.getElementById('choose-initial')?.addEventListener('change', e => { chooseInitial = (e.target as HTMLSelectElement).value; save('choose-initial', chooseInitial); resetDeck(); render(); });
    document.getElementById('choose-order')?.addEventListener('change', e => { chooseOrder = (e.target as HTMLSelectElement).value; save('choose-order', chooseOrder); resetDeck(); render(); });
    const card = document.querySelector<HTMLElement>('.swipe-card.is-top');
    if (!card) return;
    let drag: { id: number; x: number; y: number; time: number; lastX: number; lastTime: number; velocity: number } | null = null;
    const spring = () => {
        card.style.transition = reducedMotion() ? 'none' : 'transform 500ms cubic-bezier(.2,1.5,.45,1)';
        card.style.transform = '';
        card.querySelectorAll<HTMLElement>('.stamp-keep,.stamp-skip').forEach(stamp => stamp.style.opacity = '0');
    };
    card.onpointerdown = e => {
        if (deciding || !e.isPrimary || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now(), lastX: e.clientX, lastTime: performance.now(), velocity: 0 };
        card.setPointerCapture(e.pointerId); card.style.transition = 'none';
    };
    card.onpointermove = e => {
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now();
        drag.velocity = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastTime);
        drag.lastX = e.clientX; drag.lastTime = now;
        card.style.transform = `translate(${dx}px, ${dy}px) rotate(${reducedMotion() ? 0 : dx / card.offsetWidth * 18}deg)`;
        card.querySelector<HTMLElement>('.stamp-keep')!.style.opacity = String(Math.min(1, Math.max(0, dx / (card.offsetWidth * .3))));
        card.querySelector<HTMLElement>('.stamp-skip')!.style.opacity = String(Math.min(1, Math.max(0, -dx / (card.offsetWidth * .3))));
    };
    const release = (e: PointerEvent, cancel: boolean) => {
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x;
        const fast = performance.now() - drag.lastTime < 100 && Math.abs(drag.velocity) > .65 && Math.sign(drag.velocity) === Math.sign(dx);
        drag = null;
        if (card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId);
        if (!cancel && (Math.abs(dx) >= card.offsetWidth * .3 || (Math.abs(dx) > 35 && fast))) decide(dx > 0);
        else spring();
    };
    card.onpointerup = e => release(e, false);
    card.onpointercancel = e => release(e, true);
    card.onlostpointercapture = () => { if (drag) { drag = null; spring(); } };
}
window.addEventListener('keydown', e => {
    if (overviewEl) { if (e.key === 'Escape') { e.preventDefault(); closeOverview(); } return; }
    if (route() !== 'choose' || (e.target instanceof HTMLElement && (e.target.closest('input,select,textarea,summary,#choose-filters-toggle,[contenteditable="true"]'))) || e.altKey || e.metaKey || e.repeat) return;
    if (e.key === 'Backspace' || e.key.toLowerCase() === 'u' || (e.ctrlKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); undoDecision(); }
    else if (!e.ctrlKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); decide(e.key === 'ArrowRight'); }
    else if (!e.ctrlKey && e.code === 'Space') { e.preventDefault(); const p = availableCards()[0]; if (p) speak(p.name); }
});
function render() {
    deciding = false;
    const t = messages[locale], current = route();
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = `${t[current as 'choose'] || t.home} · ${t.brand}`;
    app.innerHTML = `<header><a class="brand" href="#/"><span class="brand-icon" aria-hidden="true">n.</span>${t.brand}</a><button id="locale" class="locale" aria-label="${locale === 'en' ? '切换中文' : 'Switch to English'}">${locale === 'en' ? '中文' : 'English'}</button></header><nav aria-label="${t.brand}">${(['', 'choose', 'browser', 'check'] as const).map(r => `<a href="#/${r}" ${current === r ? 'aria-current="page"' : ''}>${r ? t[r] : t.home}</a>`).join('')}</nav><main>${!meta ? `<p role="${failed ? 'alert' : 'status'}">${failed ? t.error : t.loading}</p>${failed ? `<button id="retry-meta">${t.retry}</button>` : ''}` : current === '' ? `<section class="hero"><p class="eyebrow">${t.eyebrow}</p><h1>${t.title}</h1><p class="intro">${t.intro}</p><a class="primary" href="#/choose">${t.choose} <span aria-hidden="true">↗</span></a><div class="word-art" aria-hidden="true"><span>Oliver</span><span>Charlotte</span><span>James</span><span>Emma</span><span>You.</span></div></section><section class="method"><h2>${t.method}</h2><div class="steps">${(['one', 'two', 'three'] as const).map((key, i) => `<article><span class="step-number">0${i + 1}</span><h3>${t[key]}</h3><p>${t[`${key}Text`]}</p></article>`).join('')}</div></section>` : current === 'check' ? `<section class="panel check-panel"><p class="eyebrow">${t.check}</p><h1>${t.handle}</h1><ol class="handle-steps muted"><li>${t.handleStep1}</li><li>${t.handleStep2}</li><li>${t.handleStep3}</li></ol>${selected.size ? `<fieldset class="handle-shortlist"><legend>${t.quickFill}</legend><div>${[...selected.values()].map(p => `<button type="button" data-fill="${esc(p.name)}">${esc(p.name)}</button>`).join('')}</div></fieldset>` : ''}<form id="handle-form"><label>${t.handleLabel}<input id="handle" required pattern="[A-Za-z0-9_.]{1,30}" maxlength="30" value="${esc(handle)}" autocomplete="off" title="${t.invalid}"></label><button class="primary">${t.checkName}</button></form><div id="profile-links" aria-live="polite"></div></section>${shortlist()}` : current === 'choose' ? choosePage() : `<div class="page-title"><div><p class="eyebrow">${current === 'choose' ? '01 — 02 — 03' : 'SSA / ' + year}</p><h1>${t[current as 'choose']}</h1></div><button id="reset">${t.reset}</button></div><p class="muted guidance">${t.oneText} ${t.twoText} ${t.threeText}</p><section class="panel">${form()}</section><div class="workspace"><section class="panel results"><div class="section-heading"><h2>${shortlistOnly ? t.selected : t.results}</h2>${current === 'choose' ? `<button id="show-selected">${shortlistOnly ? t.back : `${t.selected} (${selected.size})`}</button>` : ''}</div>${speechSettings()}${shortlistOnly ? shortlist() : `<fieldset class="letters"><legend>${t.initial}</legend><div>${['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button data-letter="${l}" aria-pressed="${initial === l}">${l || t.all}</button>`).join('')}</div></fieldset>${results(current === 'browser')}`}</section>${shortlist()}</div>`}</main>${meta ? `<footer><a href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer">${t.data} ${meta.years[0]}–${meta.years[1]}</a><p>${t.about}</p></footer>` : ''}`;
    bind();
}
function bind() {
    if (route() === 'choose') bindSwipe();
    document.querySelector<HTMLDetailsElement>('.speech')?.addEventListener('toggle', e => { speechOpen = (e.target as HTMLDetailsElement).open; });
    const on = (id: string, fn: (e: Event) => void, event = 'click') => document.getElementById(id)?.addEventListener(event, fn);
    on('locale', () => { locale = locale === 'en' ? 'zh' : 'en'; save('locale', locale); render(); });
    on('retry-meta', () => { void start(); });
    on('query', e => { e.preventDefault(); const data = new FormData(e.target as HTMLFormElement); year = Number(data.get('year')); gender = data.get('gender') as Person['gender']; shortlistOnly = false; void load(); }, 'submit');
    on('retry', () => { void load(); });
    on('more', () => { visible += 100; render(); });
    on('prev', () => { page--; render(); });
    on('next', () => { page++; render(); });
    on('first', () => { page = 0; render(); });
    on('last', () => { page = Math.ceil(rows.filter(p => p.name.startsWith(initial)).length / 10) - 1; render(); });
    on('reset', () => { year = Math.min(2025, meta.years[1]); gender = 'male'; initial = ''; selected.clear(); saveShortlist(); shortlistOnly = false; void load(); });
    on('show-selected', () => { shortlistOnly = !shortlistOnly; render(); });
    document.querySelectorAll<HTMLButtonElement>('[data-letter]').forEach(b => b.onclick = () => { initial = b.dataset.letter!; visible = 100; page = 0; render(); });
    document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(b => b.onclick = () => {
        const name = b.dataset.select!;
        if (selected.has(name))
            selected.delete(name);
        else {
            selected.set(name, rows.find(p => p.name === name)!);
            if (speechEnabled)
                speak(name);
        }
        saveShortlist();
        render();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(b => b.onclick = () => { selected.delete(b.dataset.remove!); saveShortlist(); render(); });
    document.querySelectorAll<HTMLButtonElement>('[data-speak]').forEach(b => { b.disabled = !synth; b.onclick = () => speak(b.dataset.speak!); });
    document.querySelectorAll<HTMLButtonElement>('[data-handle]').forEach(b => b.onclick = () => { handle = b.dataset.handle!.toLowerCase(); location.hash = '/check'; if (route() === 'check') {
        render();
        profileLinks();
    } });
    document.querySelectorAll<HTMLButtonElement>('[data-fill]').forEach(b => b.onclick = () => {
        const input = document.getElementById('handle') as HTMLInputElement;
        input.value = b.dataset.fill!.toLowerCase();
        handle = '';
        document.getElementById('profile-links')!.innerHTML = '';
        input.focus();
    });
    on('speech-enabled', e => { speechEnabled = (e.target as HTMLInputElement).checked; }, 'change');
    on('speech-lang', e => { speechLang = (e.target as HTMLSelectElement).value; voiceURI = ''; updateSpeech(); }, 'change');
    on('speech-voice', e => { voiceURI = (e.target as HTMLSelectElement).value; }, 'change');
    on('handle-form', e => { e.preventDefault(); handle = (document.getElementById('handle') as HTMLInputElement).value; profileLinks(); }, 'submit');
    if (route() === 'check' && handle)
        profileLinks();
}
function profileLinks() {
    const target = document.getElementById('profile-links');
    if (!target || !/^[A-Za-z0-9_.]{1,30}$/.test(handle))
        return;
    const value = encodeURIComponent(handle);
    target.innerHTML = [['Instagram', `https://www.instagram.com/${value}/`], ['X', `https://x.com/${value}`], ['TikTok', `https://www.tiktok.com/@${value}`], ['GitHub', `https://github.com/${value}`]].map(([platform, url]) => `<a class="profile-link" href="${url}" target="_blank" rel="noopener noreferrer">${platform} <span>@${esc(handle)} ↗</span></a>`).join('');
}
function updateSpeech() {
    // Update only settings so asynchronous voice discovery never discards form edits or focus.
    const details = document.querySelector<HTMLDetailsElement>('.speech');
    if (details) {
        const open = details.open;
        details.outerHTML = speechSettings();
        document.querySelector<HTMLDetailsElement>('.speech')!.open = open;
        document.querySelector<HTMLDetailsElement>('.speech')!.addEventListener('toggle', e => { speechOpen = (e.target as HTMLDetailsElement).open; });
        const enabled = document.querySelector<HTMLInputElement>('#speech-enabled');
        enabled?.addEventListener('change', () => { speechEnabled = enabled.checked; });
        document.querySelector('#speech-lang')?.addEventListener('change', e => { speechLang = (e.target as HTMLSelectElement).value; voiceURI = ''; updateSpeech(); });
        document.querySelector('#speech-voice')?.addEventListener('change', e => { voiceURI = (e.target as HTMLSelectElement).value; });
    }
}
synth?.addEventListener('voiceschanged', () => { voices = synth.getVoices(); updateSpeech(); });
voices = synth?.getVoices() ?? [];
window.addEventListener('hashchange', () => { closeOverview(); shortlistOnly = false; ensureNames(); render(); });
async function start() {
    failed = false;
    render();
    try {
        meta = await json<Meta>('data/meta.json');
        year = Math.max(meta.years[0], Math.min(2025, meta.years[1]));
        ensureNames();
        render();
    }
    catch {
        failed = true;
        render();
    }
}
void start();
