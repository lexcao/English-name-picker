import './styles.css';
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
        speech: 'Pronunciation', enabled: 'Read names when selected', language: 'Speech language', voice: 'Voice', defaultVoice: 'Browser default', unsupported: 'Speech is unavailable in this browser.', noVoices: 'No installed voices yet. Your browser will try its default voice.',
        listen: 'Listen to', remove: 'Remove', rank: 'Rank', name: 'Name', count: 'Births', prev: 'Previous', next: 'Next', loading: 'Loading names…', error: 'Could not load local name data. Please try again.', retry: 'Try again',
        handle: 'Try a social handle', handleHelp: 'Open a profile to check manually. A missing profile does not guarantee a handle is available; confirm on the platform.', handleLabel: 'Username', open: 'Open profile', invalid: 'Use 1–30 letters, numbers, underscores, or periods.', checkName: 'Check handle', saved: 'selected', data: 'Data: SSA, years', about: 'Top 1,000 names per year and category · National U.S. birth records', back: 'Back to names',
    },
    zh: {
        brand: '英文名挑选器', home: '首页', choose: '挑选名字', browser: '浏览名字', check: '社交账号',
        eyebrow: '新的名字，熟悉的自己。', title: '找到一个，像你的名字。', intro: '从几代人的名字中寻找灵感。收藏喜欢的名字，听听发音，找到属于你的那一个。',
        method: '三个小步骤，找到你的英文名', one: '从出生年份开始', oneText: '看看与你同龄的人常用哪些名字。', two: '寻找熟悉的声音', twoText: '试试与你本名相近的发音或首字母。', three: '大声说出来', threeText: '听听发音，试着介绍自己，留下感觉自然的名字。',
        year: '出生年份', gender: '名字类别', male: '男性', female: '女性', query: '探索名字', initial: '首字母', all: '全部',
        results: '名字灵感', selected: '我的候选名单', empty: '点击名字，将它加入候选名单。', none: '没有匹配的名字，请试试其他字母。', more: '加载更多', reset: '重置',
        speech: '发音设置', enabled: '选中名字时朗读', language: '朗读语言', voice: '朗读声音', defaultVoice: '浏览器默认', unsupported: '此浏览器不支持语音朗读。', noVoices: '暂无已安装的声音，浏览器将尝试默认声音。',
        listen: '朗读', remove: '移除', rank: '排名', name: '名字', count: '出生人数', prev: '上一页', next: '下一页', loading: '正在加载名字…', error: '无法加载本地名字数据，请重试。', retry: '重试',
        handle: '试试社交账号名', handleHelp: '打开个人主页手动查看。主页不存在并不代表账号名可用，请在对应平台确认。', handleLabel: '账号名', open: '打开主页', invalid: '请输入 1–30 个字母、数字、下划线或句点。', checkName: '查看账号名', saved: '个已选', data: 'Data: SSA, years', about: '每年每类别前 1,000 名 · 美国全国出生记录', back: '返回名字列表',
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
        if (id === requestId)
            failed = true;
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
function render() {
    const t = messages[locale], current = route();
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = `${t[current as 'choose'] || t.home} · ${t.brand}`;
    app.innerHTML = `<header><a class="brand" href="#/"><span class="brand-icon" aria-hidden="true">n.</span>${t.brand}</a><button id="locale" class="locale" aria-label="${locale === 'en' ? '切换中文' : 'Switch to English'}">${locale === 'en' ? '中文' : 'English'}</button></header><nav aria-label="${t.brand}">${(['', 'choose', 'browser', 'check'] as const).map(r => `<a href="#/${r}" ${current === r ? 'aria-current="page"' : ''}>${r ? t[r] : t.home}</a>`).join('')}</nav><main>${!meta ? `<p role="${failed ? 'alert' : 'status'}">${failed ? t.error : t.loading}</p>${failed ? `<button id="retry-meta">${t.retry}</button>` : ''}` : current === '' ? `<section class="hero"><p class="eyebrow">${t.eyebrow}</p><h1>${t.title}</h1><p class="intro">${t.intro}</p><a class="primary" href="#/choose">${t.choose} <span aria-hidden="true">↗</span></a><div class="word-art" aria-hidden="true"><span>Oliver</span><span>Charlotte</span><span>James</span><span>Emma</span><span>You.</span></div></section><section class="method"><h2>${t.method}</h2><div class="steps">${(['one', 'two', 'three'] as const).map((key, i) => `<article><span class="step-number">0${i + 1}</span><h3>${t[key]}</h3><p>${t[`${key}Text`]}</p></article>`).join('')}</div></section>` : current === 'check' ? `<section class="panel check-panel"><p class="eyebrow">${t.check}</p><h1>${t.handle}</h1><p class="muted">${t.handleHelp}</p><form id="handle-form"><label>${t.handleLabel}<input id="handle" required pattern="[A-Za-z0-9_.]{1,30}" maxlength="30" value="${esc(handle)}" autocomplete="off" title="${t.invalid}"></label><button class="primary">${t.checkName}</button></form><div id="profile-links" aria-live="polite"></div></section>${shortlist()}` : `<div class="page-title"><div><p class="eyebrow">${current === 'choose' ? '01 — 02 — 03' : 'SSA / ' + year}</p><h1>${t[current as 'choose']}</h1></div><button id="reset">${t.reset}</button></div><p class="muted guidance">${t.oneText} ${t.twoText} ${t.threeText}</p><section class="panel">${form()}</section><div class="workspace"><section class="panel results"><div class="section-heading"><h2>${shortlistOnly ? t.selected : t.results}</h2>${current === 'choose' ? `<button id="show-selected">${shortlistOnly ? t.back : `${t.selected} (${selected.size})`}</button>` : ''}</div>${speechSettings()}${shortlistOnly ? shortlist() : `<fieldset class="letters"><legend>${t.initial}</legend><div>${['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button data-letter="${l}" aria-pressed="${initial === l}">${l || t.all}</button>`).join('')}</div></fieldset>${results(current === 'browser')}`}</section>${shortlist()}</div>`}</main>${meta ? `<footer><a href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer">${t.data} ${meta.years[0]}–${meta.years[1]}</a><p>${t.about}</p></footer>` : ''}`;
    bind();
}
function bind() {
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
    on('reset', () => { year = Math.min(2025, meta.years[1]); gender = 'male'; initial = ''; selected.clear(); shortlistOnly = false; void load(); });
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
        render();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(b => b.onclick = () => { selected.delete(b.dataset.remove!); render(); });
    document.querySelectorAll<HTMLButtonElement>('[data-speak]').forEach(b => { b.disabled = !synth; b.onclick = () => speak(b.dataset.speak!); });
    document.querySelectorAll<HTMLButtonElement>('[data-handle]').forEach(b => b.onclick = () => { handle = b.dataset.handle!.toLowerCase(); location.hash = '/check'; if (route() === 'check') {
        render();
        profileLinks();
    } });
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
window.addEventListener('hashchange', () => { shortlistOnly = false; render(); });
async function start() {
    failed = false;
    render();
    try {
        meta = await json<Meta>('data/meta.json');
        year = Math.max(meta.years[0], Math.min(2025, meta.years[1]));
        await load();
    }
    catch {
        failed = true;
        render();
    }
}
void start();
