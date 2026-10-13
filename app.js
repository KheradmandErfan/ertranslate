'use strict';
/* ErTranslate – by Erfan */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LS = {
  get(k, d) { try { const v = localStorage.getItem('ert.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ert.' + k, JSON.stringify(v)); } catch {} }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ===================== Languages ===================== */
// code | native name | speech locale | tesseract code
const LANG_TABLE = `en|English|en-US|eng
fa|فارسی|fa-IR|fas
ar|العربية|ar-SA|ara
tr|Türkçe|tr-TR|tur
ru|Русский|ru-RU|rus
de|Deutsch|de-DE|deu
fr|Français|fr-FR|fra
es|Español|es-ES|spa
it|Italiano|it-IT|ita
pt|Português|pt-PT|por
nl|Nederlands|nl-NL|nld
pl|Polski|pl-PL|pol
uk|Українська|uk-UA|ukr
cs|Čeština|cs-CZ|ces
sk|Slovenčina|sk-SK|slk
hu|Magyar|hu-HU|hun
ro|Română|ro-RO|ron
bg|Български|bg-BG|bul
el|Ελληνικά|el-GR|ell
sv|Svenska|sv-SE|swe
da|Dansk|da-DK|dan
no|Norsk|nb-NO|nor
fi|Suomi|fi-FI|fin
is|Íslenska|is-IS|isl
hr|Hrvatski|hr-HR|hrv
sr|Српски|sr-RS|srp
sl|Slovenščina|sl-SI|slv
bs|Bosanski|bs-BA|bos
mk|Македонски|mk-MK|mkd
sq|Shqip|sq-AL|sqi
lt|Lietuvių|lt-LT|lit
lv|Latviešu|lv-LV|lav
et|Eesti|et-EE|est
be|Беларуская||bel
mt|Malti|mt-MT|mlt
ga|Gaeilge|ga-IE|gle
cy|Cymraeg|cy-GB|cym
gd|Gàidhlig||gla
ca|Català|ca-ES|cat
gl|Galego|gl-ES|glg
eu|Euskara|eu-ES|eus
lb|Lëtzebuergesch||ltz
fy|Frysk||fry
la|Latina||lat
eo|Esperanto||epo
he|עברית|he-IL|heb
yi|ייִדיש||yid
ur|اردو|ur-PK|urd
ps|پښتو|ps-AF|pus
ckb|کوردی (سۆرانی)||
ku|Kurdî||kmr
sd|سنڌي|sd-PK|snd
hi|हिन्दी|hi-IN|hin
bn|বাংলা|bn-BD|ben
pa|ਪੰਜਾਬੀ|pa-IN|pan
gu|ગુજરાતી|gu-IN|guj
mr|मराठी|mr-IN|mar
ta|தமிழ்|ta-IN|tam
te|తెలుగు|te-IN|tel
kn|ಕನ್ನಡ|kn-IN|kan
ml|മലയാളം|ml-IN|mal
si|සිංහල|si-LK|sin
ne|नेपाली|ne-NP|nep
or|ଓଡ଼ିଆ||ori
as|অসমীয়া||asm
th|ไทย|th-TH|tha
vi|Tiếng Việt|vi-VN|vie
id|Indonesia|id-ID|ind
ms|Melayu|ms-MY|msa
tl|Filipino|fil-PH|tgl
zh-CN|简体中文|zh-CN|chi_sim
zh-TW|繁體中文|zh-TW|chi_tra
ja|日本語|ja-JP|jpn
ko|한국어|ko-KR|kor
mn|Монгол|mn-MN|mon
km|ខ្មែរ|km-KH|khm
lo|ລາວ|lo-LA|lao
my|မြန်မာ|my-MM|mya
ka|ქართული|ka-GE|kat
hy|Հայերեն|hy-AM|hye
az|Azərbaycanca|az-AZ|aze
kk|Қазақша|kk-KZ|kaz
uz|Oʻzbekcha|uz-UZ|uzb
ky|Кыргызча||kir
tg|Тоҷикӣ||tgk
tk|Türkmençe||tuk
af|Afrikaans|af-ZA|afr
sw|Kiswahili|sw-KE|swa
am|አማርኛ|am-ET|amh
so|Soomaali|so-SO|
zu|isiZulu|zu-ZA|
xh|isiXhosa||
ha|Hausa||
yo|Yorùbá||yor
ig|Igbo||
sn|chiShona||
st|Sesotho||
ny|Chichewa||
rw|Kinyarwanda||
mg|Malagasy||
ht|Kreyòl ayisyen||hat`;
const LANGS = LANG_TABLE.split('\n').map(l => { const [code, native, sp, ocr] = l.split('|'); return { code, native, sp: sp || code, ocr: ocr || '' }; });
const L = Object.fromEntries(LANGS.map(l => [l.code, l]));
const RTL = new Set(['fa', 'ar', 'he', 'ur', 'ps', 'ckb', 'sd', 'yi']);

const dnInst = {};
const dnCache = {};
function dn(code, loc) {
  const k = loc + '|' + code;
  if (k in dnCache) return dnCache[k];
  let v = '';
  try { dnInst[loc] = dnInst[loc] || new Intl.DisplayNames([loc], { type: 'language' }); v = dnInst[loc].of(code) || ''; } catch {}
  return (dnCache[k] = v);
}
function norm(c) {
  if (!c) return null;
  if (c === 'iw') c = 'he';
  if (c === 'zh') c = 'zh-CN';
  if (c === 'zh-Hant') c = 'zh-TW';
  if (L[c]) return c;
  const b = c.split('-')[0];
  return L[b] ? b : null;
}

/* ===================== Interface strings ===================== */
const EN = {
  tabText: 'Text', tabVoice: 'Voice', tabCamera: 'Camera', tabConv: 'Chat', tabDict: 'Define', tabHist: 'History',
  detect: 'Detect language', typeHere: 'Type or paste text', translation: 'Translation',
  listening: 'Listening…', tapMic: 'Tap the mic and speak', heard: 'You said',
  takePhoto: 'Take photo', chooseImage: 'Choose image', reading: 'Reading text…', translatingTxt: 'Translating…',
  loadingOcr: 'Loading text reader…', noText: 'No text found in the image', original: 'Original text',
  personA: 'Person 1', personB: 'Person 2', tapToTalk: 'Tap to talk',
  convEmpty: 'Pick a language for each person, then tap a mic to start.',
  word: 'Word', idiom: 'Idiom', lookup: 'Look up', searchPlaceholder: 'Word or idiom',
  noResult: 'Nothing found', example: 'Example', translatedFrom: 'Searched as',
  historyEmpty: 'Your translations will appear here', clearAll: 'Clear all', confirmClear: 'Tap again to delete all',
  delete: 'Delete', useAgain: 'Use again',
  searchLang: 'Search language', copy: 'Copy', copied: 'Copied', speak: 'Listen', swap: 'Swap languages',
  micUnsupported: "Voice input isn't supported in this browser", micDenied: 'Microphone access was denied',
  noSpeech: "Didn't hear anything", error: 'Something went wrong. Check your connection and try again.',
  madeWith: 'Made with', by: 'by', interfaceLang: 'Interface language', cancel: 'Close',
  translatingUI: 'Translating the interface…', autoSpeak: 'Speak translations aloud',
  themeSystem: 'Follow system', themeLight: 'Light', themeDark: 'Dark', theme: 'Theme',
  searching: 'Searching…', showingFor: 'Showing results for', source: 'Source'
};
const FA = {
  tabText: 'ترجمه', tabVoice: 'صوتی', tabCamera: 'تصویری', tabConv: 'مکالمه', tabDict: 'معنی', tabHist: 'تاریخچه',
  detect: 'تشخیص زبان', typeHere: 'متن را بنویس یا پیست کن', translation: 'ترجمه',
  listening: 'در حال گوش دادن…', tapMic: 'روی میکروفون بزن و صحبت کن', heard: 'گفتی',
  takePhoto: 'عکس بگیر', chooseImage: 'انتخاب تصویر', reading: 'در حال خواندن متن…', translatingTxt: 'در حال ترجمه…',
  loadingOcr: 'در حال آماده‌سازی متن‌خوان…', noText: 'متنی در تصویر پیدا نشد', original: 'متن اصلی',
  personA: 'نفر اول', personB: 'نفر دوم', tapToTalk: 'برای صحبت بزن',
  convEmpty: 'برای هر نفر یک زبان انتخاب کن، بعد روی میکروفون بزن.',
  word: 'کلمه', idiom: 'اصطلاح', lookup: 'جستجو', searchPlaceholder: 'کلمه یا اصطلاح',
  noResult: 'چیزی پیدا نشد', example: 'مثال', translatedFrom: 'جستجو شده به‌صورت',
  historyEmpty: 'ترجمه‌هات اینجا ذخیره می‌شن', clearAll: 'پاک کردن همه', confirmClear: 'دوباره بزن تا همه پاک بشه',
  delete: 'حذف', useAgain: 'استفاده دوباره',
  searchLang: 'جستجوی زبان', copy: 'کپی', copied: 'کپی شد', speak: 'گوش بده', swap: 'جابجایی زبان‌ها',
  micUnsupported: 'این مرورگر ورودی صوتی رو پشتیبانی نمی‌کنه', micDenied: 'اجازه‌ی میکروفون داده نشد',
  noSpeech: 'صدایی شنیده نشد', error: 'مشکلی پیش اومد. اینترنتت رو چک کن و دوباره تلاش کن.',
  madeWith: 'ساخته شده با', by: 'توسط', interfaceLang: 'زبان رابط', cancel: 'بستن',
  translatingUI: 'در حال ترجمه‌ی رابط…', autoSpeak: 'پخش صوتی خودکار ترجمه',
  themeSystem: 'هماهنگ با سیستم', themeLight: 'روشن', themeDark: 'تیره', theme: 'تم',
  searching: 'در حال جستجو…', showingFor: 'نتایج برای', source: 'منبع'
};
let ui = LS.get('ui', 'en');
let strings = EN;
const t = k => strings[k] ?? EN[k] ?? k;

function applyI18n() {
  $$('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  $$('[data-ip]').forEach(e => { e.placeholder = t(e.dataset.ip); });
  $$('[data-ia]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.ia)); });
  document.documentElement.lang = ui;
  document.documentElement.dir = RTL.has(ui) ? 'rtl' : 'ltr';
  $('#uiCode').textContent = ui.split('-')[0].toUpperCase();
  $('#mw').textContent = t('madeWith');
  const name = ['fa', 'ar', 'ur', 'ps', 'ckb', 'sd'].includes(ui) ? 'عرفان' : 'Erfan';
  $('#mb').textContent = t('by') + ' ' + name;
  langBars.forEach(f => f());
  drawConvLangs();
  if (tab === 'hist') renderHistory();
}
let uiTok = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));
async function setUI(code) {
  const tok = ++uiTok, root = document.documentElement, btn = $('#uiLang');
  btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');
  root.classList.add('swapping');
  const fade = wait(260);
  let next;
  if (code === 'en') next = EN;
  else if (code === 'fa') next = FA;
  else {
    next = LS.get('uic.' + code, null);
    if (!next) {
      toast(EN.translatingUI);
      try {
        const keys = Object.keys(EN);
        const out = await translateMany(keys.map(k => EN[k]), 'en', code);
        next = {}; keys.forEach((k, i) => { if (out[i]) next[k] = out[i]; });
        LS.set('uic.' + code, next);
      } catch { next = {}; }
    }
  }
  await fade;
  if (tok !== uiTok) return;
  ui = code; LS.set('ui', code); strings = next;
  applyI18n();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('swapping')));
}

/* ===================== Small UI helpers ===================== */
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
const setCollapse = (sel, open) => $(sel).classList.toggle('open', open);
async function copyText(s) { try { await navigator.clipboard.writeText(s); toast(t('copied')); } catch {} }
function speak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = L[lang]?.sp || lang || 'en-US';
  speechSynthesis.speak(u);
}
const fmtTime = ts => { try { return new Intl.DateTimeFormat(ui, { dateStyle: 'medium', timeStyle: 'short' }).format(ts); } catch { return new Date(ts).toLocaleString(); } };

/* ===================== Translation engine ===================== */
async function gtx(text, from, to) {
  const u = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + encodeURIComponent(from) + '&tl=' + encodeURIComponent(to);
  const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'q=' + encodeURIComponent(text) });
  if (!r.ok) throw new Error('gtx');
  const j = await r.json();
  return { text: j[0].map(x => x[0]).join(''), from: norm(j[2]) || (from === 'auto' ? null : from) };
}
async function myMemory(text, from, to) {
  const lp = (from === 'auto' ? 'Autodetect' : from) + '|' + to;
  const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text.slice(0, 480)) + '&langpair=' + encodeURIComponent(lp));
  const j = await r.json();
  if (!j.responseData || !j.responseData.translatedText) throw new Error('mm');
  return { text: j.responseData.translatedText, from: from === 'auto' ? null : from };
}
async function translate(text, from, to) {
  text = (text || '').trim();
  if (!text) return { text: '', from };
  if (from === to) return { text, from };
  try { return await gtx(text, from, to); } catch {}
  return await myMemory(text, from, to);
}
// Translates many short lines with as few requests as possible
async function translateMany(arr, from, to) {
  const out = new Array(arr.length).fill('');
  const flat = arr.map(s => String(s).replace(/\s*\n\s*/g, ' ').trim());
  const chunks = []; let cur = [], len = 0;
  flat.forEach((s, i) => {
    if (len + s.length > 1400 && cur.length) { chunks.push(cur); cur = []; len = 0; }
    cur.push(i); len += s.length + 1;
  });
  if (cur.length) chunks.push(cur);
  for (const idx of chunks) {
    const r = await translate(idx.map(i => flat[i]).join('\n'), from, to);
    const parts = r.text.split('\n');
    if (parts.length === idx.length) idx.forEach((i, k) => { out[i] = parts[k].trim(); });
    else for (const i of idx) out[i] = (await translate(flat[i], from, to)).text;
  }
  return out;
}

/* ===================== Language pairs & picker ===================== */
const pairs = Object.assign({
  text: { src: 'auto', dst: 'fa' }, voice: { src: 'en', dst: 'fa' }, camera: { src: 'en', dst: 'fa' },
  dict: { src: 'en', dst: 'fa' }, conv: { a: 'fa', b: 'en' }
}, LS.get('pairs', {}));
const savePairs = () => LS.set('pairs', pairs);
const detected = {};
const langBars = [];
const onPair = {};

let sheetClose = null;
function openSheet({ title, search = true, note = '', render, onClose }) {
  const s = $('#sheet'), q = $('#sheetQ'), body = $('#sheetBody');
  $('#sheetTitle').textContent = title;
  q.parentElement.hidden = !search; q.value = '';
  const n = $('#sheetNote'); n.hidden = !note; n.textContent = note;
  const draw = () => render(q.value.trim().toLowerCase(), body);
  q.oninput = draw; draw(); body.scrollTop = 0;
  s.classList.add('open'); s.setAttribute('aria-hidden', 'false');
  if (search && matchMedia('(hover:hover)').matches) setTimeout(() => q.focus(), 300);
  sheetClose = v => { s.classList.remove('open'); s.setAttribute('aria-hidden', 'true'); sheetClose = null; if (onClose) onClose(v); };
  return { redraw: draw };
}
$('#sheetBack').onclick = $('#sheetX').onclick = () => sheetClose && sheetClose();
addEventListener('keydown', e => { if (e.key === 'Escape' && sheetClose) sheetClose(); });

function pickLanguage({ auto = false, current } = {}) {
  return new Promise(res => {
    const items = (auto ? [{ code: 'auto', native: t('detect') }] : []).concat(LANGS);
    openSheet({
      title: t('searchLang'), search: true, onClose: res,
      render(f, body) {
        const frag = document.createDocumentFragment();
        items.forEach(l => {
          const sub = l.code === 'auto' ? '' : dn(l.code, ui);
          if (f && !(l.native + ' ' + sub + ' ' + dn(l.code, 'en') + ' ' + l.code).toLowerCase().includes(f)) return;
          const b = document.createElement('button');
          b.className = 'row' + (l.code === current ? ' on' : '');
          b.innerHTML = `<span>${esc(l.native)}</span><small>${esc(sub)}</small>`;
          b.onclick = () => sheetClose && sheetClose(l.code);
          frag.append(b);
        });
        body.replaceChildren(frag);
      }
    });
  });
}

function langBar(key, auto = false) {
  const host = $('#lb-' + key);
  host.className = 'langbar';
  host.innerHTML = `<button class="lb glass-lite"></button><button class="swap" data-ia="swap"><svg class="ic"><use href="#i-swap"/></svg></button><button class="lb glass-lite"></button>`;
  const [bs, sw, bd] = host.children;
  const draw = () => {
    const p = pairs[key];
    bs.textContent = p.src === 'auto' ? (detected[key] ? `${t('detect')} · ${L[detected[key]].native}` : t('detect')) : L[p.src].native;
    bd.textContent = L[p.dst].native;
    sw.setAttribute('aria-label', t('swap'));
  };
  bs.onclick = async () => { const c = await pickLanguage({ auto, current: pairs[key].src }); if (c) { pairs[key].src = c; savePairs(); draw(); onPair[key] && onPair[key](); } };
  bd.onclick = async () => { const c = await pickLanguage({ current: pairs[key].dst }); if (c) { pairs[key].dst = c; savePairs(); draw(); onPair[key] && onPair[key](); } };
  sw.onclick = () => {
    const p = pairs[key];
    if (p.src === 'auto') { if (!detected[key] || detected[key] === p.dst) return; p.src = p.dst; p.dst = detected[key]; }
    else [p.src, p.dst] = [p.dst, p.src];
    savePairs(); draw(); onPair[key] && onPair[key]();
  };
  langBars.push(draw); draw();
}

/* ===================== Interface language button (tap = EN⇄FA, hold = any) ===================== */
(() => {
  const b = $('#uiLang'); let timer, held = false;
  b.addEventListener('pointerdown', () => { held = false; b.classList.add('hold'); timer = setTimeout(async () => {
    held = true; b.classList.remove('hold');
    const c = await pickLanguage({ current: ui }); if (c) setUI(c);
  }, 480); });
  const end = () => { clearTimeout(timer); b.classList.remove('hold'); };
  b.addEventListener('pointerleave', end); b.addEventListener('pointercancel', end);
  b.addEventListener('pointerup', () => { end(); if (!held) setUI(ui === 'en' ? 'fa' : 'en'); });
  b.addEventListener('contextmenu', e => e.preventDefault());
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUI(ui === 'en' ? 'fa' : 'en'); } });
})();

/* ===================== History ===================== */
function addHistory(item) {
  const h = LS.get('hist', []);
  const last = h[0];
  if (item.type === 'text' && last && last.type === 'text' && Date.now() - last.t < 10000 &&
      (item.from.startsWith(last.from) || last.from.startsWith(item.from))) h.shift();
  h.unshift({ id: Date.now() + Math.random().toString(36).slice(2, 6), t: Date.now(), ...item });
  LS.set('hist', h.slice(0, 500));
  if (tab === 'hist') renderHistory();
}
const TYPE_ICON = { text: 'text', voice: 'mic', camera: 'camera', conv: 'chat', dict: 'book' };
function renderHistory() {
  const h = LS.get('hist', []); const box = $('#hList');
  $('#hClear').hidden = !h.length;
  if (!h.length) { box.innerHTML = `<p class="empty">${esc(t('historyEmpty'))}</p>`; return; }
  box.innerHTML = h.map(i => `<article class="hitem glass" data-id="${esc(i.id)}">
    <div class="hmeta"><span><svg class="ic" style="width:14px;height:14px;vertical-align:-2px"><use href="#i-${TYPE_ICON[i.type] || 'text'}"/></svg> ${esc(i.src)} → ${esc(i.dst)}</span><span>${esc(fmtTime(i.t))}</span></div>
    <p class="f" dir="auto">${esc(i.from)}</p><p class="o" dir="auto">${esc(i.to)}</p>
    <div class="tools"><button class="tool" data-a="again" aria-label="${esc(t('useAgain'))}"><svg class="ic"><use href="#i-redo"/></svg></button>
    <button class="tool" data-a="copy" aria-label="${esc(t('copy'))}"><svg class="ic"><use href="#i-copy"/></svg></button>
    <button class="tool" data-a="del" aria-label="${esc(t('delete'))}"><svg class="ic"><use href="#i-trash"/></svg></button></div></article>`).join('');
}
$('#hList').addEventListener('click', e => {
  const btn = e.target.closest('[data-a]'); if (!btn) return;
  const card = btn.closest('.hitem'); const id = card.dataset.id;
  const h = LS.get('hist', []); const it = h.find(x => x.id === id); if (!it) return;
  if (btn.dataset.a === 'copy') copyText(it.to);
  if (btn.dataset.a === 'del') {
    card.style.transition = 'opacity .3s,transform .3s'; card.style.opacity = 0; card.style.transform = 'scale(.94)';
    setTimeout(() => { LS.set('hist', LS.get('hist', []).filter(x => x.id !== id)); renderHistory(); }, 280);
  }
  if (btn.dataset.a === 'again') {
    pairs.text.src = L[it.src] ? it.src : 'auto'; pairs.text.dst = L[it.dst] ? it.dst : pairs.text.dst; savePairs();
    langBars.forEach(f => f()); $('#tIn').value = it.from; showTab('text'); runText(true);
  }
});
let clearArm;
$('#hClear').onclick = () => {
  const lab = $('#hClear span');
  if (!clearArm) { lab.textContent = t('confirmClear'); clearArm = setTimeout(() => { clearArm = null; lab.textContent = t('clearAll'); }, 3000); return; }
  clearTimeout(clearArm); clearArm = null; lab.textContent = t('clearAll'); LS.set('hist', []); renderHistory();
};

/* ===================== Tabs ===================== */
const TABS = ['text', 'voice', 'camera', 'conv', 'dict', 'hist'];
let tab = null;
function showTab(name) {
  if (tab === name) return;
  tab = name; LS.set('tab', name);
  TABS.forEach(n => { const p = $('#p-' + n); p.hidden = n !== name; p.classList.toggle('on', n === name); });
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  $('#nav').style.setProperty('--i', TABS.indexOf(name));
  if (name === 'hist') renderHistory();
  if (name !== 'voice') stopListening();
  scrollTo({ top: 0 });
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });

/* ===================== Text tab ===================== */
let tReq = 0, tTimer, lastText = { to: '', lang: 'en' };
async function runText(now) {
  const txt = $('#tIn').value.trim(); const id = ++tReq;
  if (!txt) { setCollapse('#tRes', false); return; }
  try {
    const p = pairs.text; const r = await translate(txt, p.src, p.dst);
    if (id !== tReq) return;
    if (p.src === 'auto') { detected.text = r.from; langBars.forEach(f => f()); }
    $('#tOut').textContent = r.text; setCollapse('#tRes', true);
    lastText = { to: r.text, lang: p.dst };
    addHistory({ type: 'text', src: r.from || p.src, dst: p.dst, from: txt, to: r.text });
  } catch { if (id === tReq) toast(t('error')); }
}
onPair.text = () => runText(true);
$('#tIn').addEventListener('input', () => { clearTimeout(tTimer); tTimer = setTimeout(runText, 700); });
$('#tClear').onclick = () => { $('#tIn').value = ''; tReq++; detected.text = null; langBars.forEach(f => f()); setCollapse('#tRes', false); $('#tIn').focus(); };
$('#tSpeakIn').onclick = () => speak($('#tIn').value, pairs.text.src === 'auto' ? detected.text : pairs.text.src);
$('#tSpeakOut').onclick = () => speak(lastText.to, lastText.lang);
$('#tCopy').onclick = () => copyText($('#tOut').textContent);

/* ===================== Speech recognition ===================== */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRec = null;
function listen(lang, { onInterim, onDone }) {
  const r = new SR(); r.lang = L[lang].sp; r.interimResults = true; r.continuous = false;
  let final = '', err = null;
  r.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) final += x[0].transcript; else interim += x[0].transcript; }
    onInterim && onInterim((final + interim).trim());
  };
  r.onerror = e => { err = e.error; };
  r.onend = () => { activeRec = null; onDone((final).trim(), err); };
  activeRec = r; r.start(); return r;
}
function stopListening() { if (activeRec) { try { activeRec.stop(); } catch {} } }
function micError(err) {
  if (err === 'not-allowed' || err === 'service-not-allowed') toast(t('micDenied'));
  else if (err === 'no-speech') toast(t('noSpeech'));
  else if (err && err !== 'aborted') toast(t('error'));
}

/* ===================== Voice tab ===================== */
let vLast = { to: '', lang: 'en' };
$('#vMic').onclick = () => {
  if (!SR) return toast(t('micUnsupported'));
  if (activeRec) return stopListening();
  const p = pairs.voice, mic = $('#vMic'), hint = $('#vHint');
  mic.classList.add('live'); hint.textContent = t('listening');
  try {
    listen(p.src, {
      onInterim: s => { $('#vHeard').textContent = s; setCollapse('#vRes', true); },
      async onDone(text, err) {
        mic.classList.remove('live'); hint.textContent = t('tapMic');
        if (err) micError(err);
        if (!text) { if (!err) setCollapse('#vRes', false); return; }
        $('#vHeard').textContent = text;
        try {
          const r = await translate(text, p.src, p.dst);
          $('#vOut').textContent = r.text; vLast = { to: r.text, lang: p.dst };
          addHistory({ type: 'voice', src: p.src, dst: p.dst, from: text, to: r.text });
        } catch { toast(t('error')); }
      }
    });
  } catch { mic.classList.remove('live'); hint.textContent = t('tapMic'); }
};
$('#vSpeak').onclick = () => speak(vLast.to, vLast.lang);
$('#vCopy').onclick = () => copyText($('#vOut').textContent);

/* ===================== Camera tab ===================== */
let ocrWorker = null, ocrLang = '';
const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s); });
async function getOcr(lang) {
  if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
  if (ocrWorker && ocrLang === lang) return ocrWorker;
  if (ocrWorker) { await ocrWorker.terminate(); ocrWorker = null; }
  ocrWorker = await Tesseract.createWorker(lang, 1, { logger: m => { if (m.status === 'recognizing text') camProgress(.15 + m.progress * .7); } });
  ocrLang = lang; return ocrWorker;
}
const camStatus = s => { $('#camStatus').textContent = s; };
const camProgress = f => { $('#camBar').style.width = Math.round(f * 100) + '%'; };
$('#camShoot').onclick = () => $('#camIn').click();
$('#camPick').onclick = () => $('#galIn').click();
[$('#camIn'), $('#galIn')].forEach(i => { i.onchange = () => { const f = i.files[0]; i.value = ''; if (f) runCamera(f); }; });
let camLast = { to: '', lang: 'en' };

async function runCamera(file) {
  const p = pairs.camera, cv = $('#camCanvas'), ctx = cv.getContext('2d');
  $('#camTexts').hidden = true; setCollapse('#camRes', true); camProgress(0.02);
  try {
    const bmp = await createImageBitmap(file);
    const sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
    ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    camStatus(t('loadingOcr'));
    const w = await getOcr(L[p.src]?.ocr || 'eng');
    camStatus(t('reading')); camProgress(.15);
    const { data } = await w.recognize(cv);
    const lines = (data.lines || []).filter(l => l.text.trim().length > 1 && l.confidence > 35);
    if (!lines.length) { camStatus(t('noText')); camProgress(0); return; }
    camStatus(t('translatingTxt')); camProgress(.9);
    const src = lines.map(l => l.text.replace(/\s+/g, ' ').trim());
    const tr = await translateMany(src, p.src, p.dst);
    const rtl = RTL.has(p.dst);
    lines.forEach((l, i) => {
      const { x0, y0, x1, y1 } = l.bbox, h = Math.max(12, y1 - y0), txt = tr[i] || src[i];
      let size = h * .82; ctx.font = `600 ${size}px Vazirmatn, system-ui, sans-serif`;
      while (ctx.measureText(txt).width > (x1 - x0) * 1.15 && size > 10) { size -= 1; ctx.font = `600 ${size}px Vazirmatn, system-ui, sans-serif`; }
      const tw = Math.max(x1 - x0, ctx.measureText(txt).width + 8);
      const bx = rtl ? x1 - tw : x0;
      ctx.fillStyle = 'rgba(12,18,34,.86)'; ctx.fillRect(bx - 3, y0 - 2, tw + 6, h + 4);
      ctx.fillStyle = '#f4f7fb'; ctx.textBaseline = 'middle'; ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(txt, rtl ? x1 + 0 : x0, y0 + h / 2 + 1);
    });
    camProgress(1); camStatus('');
    $('#camOrig').textContent = src.join('\n'); $('#camOut').textContent = tr.join('\n');
    $('#camTexts').hidden = false; camLast = { to: tr.join(' '), lang: p.dst };
    addHistory({ type: 'camera', src: p.src, dst: p.dst, from: src.join(' '), to: tr.join(' ') });
  } catch (e) { camStatus(t('error')); camProgress(0); }
}
$('#camSpeak').onclick = () => speak(camLast.to, camLast.lang);
$('#camCopy').onclick = () => copyText($('#camOut').textContent);

/* ===================== Conversation tab ===================== */
const drawConvLangs = () => { $('#cLangA').textContent = L[pairs.conv.a].native; $('#cLangB').textContent = L[pairs.conv.b].native; };
$('#cLangA').onclick = async () => { const c = await pickLanguage({ current: pairs.conv.a }); if (c) { pairs.conv.a = c; savePairs(); drawConvLangs(); } };
$('#cLangB').onclick = async () => { const c = await pickLanguage({ current: pairs.conv.b }); if (c) { pairs.conv.b = c; savePairs(); drawConvLangs(); } };
$('#autoSpeak').checked = LS.get('autoSpeak', true);
$('#autoSpeak').onchange = e => LS.set('autoSpeak', e.target.checked);

function addBubble(side, orig, trans, live) {
  $('#chatEmpty')?.remove();
  const chat = $('#chat'), b = document.createElement('div');
  b.className = `bubble ${side}${live ? ' live' : ''}`;
  b.innerHTML = `<small dir="auto"></small><p dir="auto"></p>`;
  b.firstChild.textContent = orig; b.lastChild.textContent = trans;
  chat.append(b); chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }); return b;
}
function convTalk(side) {
  if (!SR) return toast(t('micUnsupported'));
  if (activeRec) return stopListening();
  const from = pairs.conv[side], to = pairs.conv[side === 'a' ? 'b' : 'a'];
  const mic = $(side === 'a' ? '#cMicA' : '#cMicB'); mic.classList.add('live');
  let live = null;
  try {
    listen(from, {
      onInterim: s => { if (!live) live = addBubble(side, '', '…', true); live.firstChild.textContent = s; },
      async onDone(text, err) {
        mic.classList.remove('live');
        if (err) micError(err);
        if (!text) { live?.remove(); return; }
        live?.remove();
        const b = addBubble(side, text, '…');
        try {
          const r = await translate(text, from, to);
          b.lastChild.textContent = r.text;
          addHistory({ type: 'conv', src: from, dst: to, from: text, to: r.text });
          if ($('#autoSpeak').checked) speak(r.text, to);
        } catch { b.lastChild.textContent = t('error'); }
      }
    });
  } catch { mic.classList.remove('live'); }
}
$('#cMicA').onclick = () => convTalk('a');
$('#cMicB').onclick = () => convTalk('b');

/* ===================== Dictionary tab ===================== */
let dMode = 'word';
$$('.chip').forEach(c => c.onclick = () => { dMode = c.dataset.mode; $$('.chip').forEach(x => x.classList.toggle('on', x === c)); if ($('#dIn').value.trim()) runDict(); });
const stripHtml = h => new DOMParser().parseFromString(h || '', 'text/html').body.textContent.trim();
const clean = s => (s || '').replace(/\s+/g, ' ').trim();
const NF = () => new Error('nf');

async function fetchT(url, ms = 9000) {
  const c = new AbortController(), id = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { signal: c.signal }); } finally { clearTimeout(id); }
}
// Cambridge has no public API and blocks direct browser requests, so we read the page through free CORS proxies.
const PROXIES = [
  u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u)
];
async function viaProxy(url) {
  for (const p of PROXIES) {
    try { const r = await fetchT(p(url)); if (r.ok) { const tx = await r.text(); if (tx.length > 3000) return tx; } } catch {}
  }
  throw new Error('net');
}
async function cambridge(q, idiom) {
  const slug = q.trim().toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, '').replace(/[\s']+/g, '-');
  if (!slug) throw NF();
  const url = 'https://dictionary.cambridge.org/dictionary/english/' + encodeURIComponent(slug);
  const doc = new DOMParser().parseFromString(await viaProxy(url), 'text/html');
  const groups = []; let ph = '';
  doc.querySelectorAll('.entry-body__el').forEach(en => {
    const pos = clean((en.querySelector('.posgram .pos, .pos.dpos, .pos') || {}).textContent);
    if (!ph) { const ip = clean((en.querySelector('.us .ipa, .uk .ipa, .ipa') || {}).textContent); if (ip) ph = '/' + ip + '/'; }
    const defs = [...en.querySelectorAll('.def-block, .ddef_block')]
      .filter(b => idiom || !b.closest('.idiom-block, .phrase-block'))
      .slice(0, 3)
      .map(b => ({
        d: clean((b.querySelector('.def') || {}).textContent).replace(/:$/, ''),
        ex: clean((b.querySelector('.examp') || {}).textContent),
        lvl: clean((b.querySelector('.epp-xref') || {}).textContent)
      })).filter(d => d.d);
    if (defs.length) groups.push({ pos, defs });
  });
  if (!groups.length) throw NF();
  return { ph, groups: groups.slice(0, 6), source: 'Cambridge Dictionary', url };
}
async function dictApi(q) {
  const r = await fetchT('https://api.dictionaryapi.dev/v2/entries/en/' + encodeURIComponent(q.trim()));
  if (r.status === 404) throw NF();
  if (!r.ok) throw new Error('net');
  const j = await r.json(); let ph = ''; const groups = [];
  j.forEach(e => { ph = ph || e.phonetic || ''; e.meanings.forEach(m => groups.push({ pos: m.partOfSpeech, defs: m.definitions.slice(0, 3).map(d => ({ d: d.definition, ex: d.example || '' })) })); });
  if (!groups.length) throw NF();
  return { ph, groups: groups.slice(0, 6), source: 'Free Dictionary', url: 'https://dictionaryapi.dev/' };
}
async function wikt(q) {
  const get = async title => {
    const r = await fetchT('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(title.replace(/ /g, '_')));
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('net');
    return r.json();
  };
  const title = q.trim().toLowerCase().replace(/\s+/g, ' ');
  let j = await get(title), matched = '';
  if (!j) {
    try {
      const s = await fetchT('https://en.wiktionary.org/w/api.php?action=opensearch&format=json&origin=*&limit=1&search=' + encodeURIComponent(title));
      const sj = await s.json(); const m = sj[1] && sj[1][0];
      if (m) { j = await get(m); matched = m; }
    } catch {}
  }
  if (!j) throw NF();
  const arr = j.en || Object.values(j)[0] || [];
  const groups = arr.slice(0, 5).map(e => ({
    pos: e.partOfSpeech,
    defs: (e.definitions || []).filter(d => d.definition && stripHtml(d.definition)).slice(0, 3)
      .map(d => ({ d: stripHtml(d.definition), ex: stripHtml((d.examples || [])[0] || '') }))
  })).filter(g => g.defs.length);
  if (!groups.length) throw NF();
  return { ph: '', groups, source: 'Wiktionary', url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent((matched || title).replace(/ /g, '_')), matched };
}
let dReq = 0;
async function runDict() {
  const term = $('#dIn').value.trim(); if (!term) return;
  const id = ++dReq, out = $('#dOut'), p = pairs.dict;
  out.innerHTML = `<p class="empty">${esc(t('searching'))}</p>`; setCollapse('#dRes', true);
  try {
    let q = term, note = '';
    if (p.src !== 'en') { q = (await translate(term, p.src, 'en')).text; note = q; }
    const idiom = dMode === 'idiom';
    const order = idiom ? [wikt, cambridge] : [cambridge, dictApi, wikt];
    let res = null, net = false;
    for (const fn of order) {
      try { res = await fn(q, idiom); if (res && res.groups.length) break; res = null; }
      catch (e) { res = null; if (e.message !== 'nf') net = true; }
    }
    if (id !== dReq) return;
    if (!res) { out.innerHTML = `<p class="empty">${esc(net ? t('error') : t('noResult'))}</p>`; return; }
    const defs = res.groups.flatMap(g => g.defs.map(d => d.d));
    let tr = [];
    if (p.dst !== 'en') { try { tr = await translateMany([q, ...defs], 'en', p.dst); } catch {} }
    if (id !== dReq) return;
    let html = `<div class="dhead"><b dir="auto">${esc(res.matched || q)}</b>${res.ph ? `<small>${esc(res.ph)}</small>` : ''}${tr[0] ? `<span class="tt" dir="auto">${esc(tr[0])}</span>` : ''}</div>`;
    if (note) html += `<p class="note">${esc(t('translatedFrom'))}: ${esc(note)}</p>`;
    if (res.matched && res.matched.toLowerCase() !== q.trim().toLowerCase()) html += `<p class="note">${esc(t('showingFor'))}: ${esc(res.matched)}</p>`;
    let k = 0;
    res.groups.forEach(g => {
      html += `<h4>${esc(g.pos)}</h4><ol>`;
      g.defs.forEach(d => {
        const a = tr[k + 1]; k++;
        html += `<li><p dir="auto">${d.lvl ? `<span class="lvl">${esc(d.lvl)}</span>` : ''}${esc(d.d)}</p>${a ? `<p class="alt" dir="auto">${esc(a)}</p>` : ''}${d.ex ? `<p class="ex" dir="auto">${esc(t('example'))}: ${esc(d.ex)}</p>` : ''}</li>`;
      });
      html += '</ol>';
    });
    html += `<p class="note">${esc(t('source'))}: <a href="${esc(res.url)}" target="_blank" rel="noopener">${esc(res.source)}</a></p>`;
    out.innerHTML = html;
    addHistory({ type: 'dict', src: p.src, dst: p.dst, from: term, to: tr[1] || defs[0] });
  } catch { if (id === dReq) { out.innerHTML = `<p class="empty">${esc(t('error'))}</p>`; } }
}
$('#dGo').onclick = runDict;
$('#dIn').addEventListener('keydown', e => { if (e.key === 'Enter') runDict(); });
onPair.dict = () => { if ($('#dIn').value.trim()) runDict(); };

/* ===================== Theme (system / light / dark) ===================== */
const THEMES = ['system', 'light', 'dark'];
let themePref = LS.get('theme', 'system');
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const eff = themePref === 'system' ? (darkMQ.matches ? 'dark' : 'light') : themePref;
  const root = document.documentElement;
  root.dataset.theme = eff; root.dataset.pref = themePref;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = eff === 'dark' ? '#1e2a78' : '#d9efff';
}
darkMQ.addEventListener('change', applyTheme);
$('#themeBtn').onclick = () => {
  themePref = THEMES[(THEMES.indexOf(themePref) + 1) % THEMES.length];
  LS.set('theme', themePref); applyTheme();
  toast(t({ system: 'themeSystem', light: 'themeLight', dark: 'themeDark' }[themePref]));
};

/* ===================== Init ===================== */
['text', 'voice', 'camera', 'dict'].forEach(k => langBar(k, k === 'text'));
(async function init() {
  applyTheme();
  if (ui !== 'en' && ui !== 'fa') { const c = LS.get('uic.' + ui, null); strings = c || EN; }
  else strings = ui === 'fa' ? FA : EN;
  tab = null; applyI18n();
  const saved = LS.get('tab', 'text');
  showTab(TABS.includes(saved) ? saved : 'text');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
