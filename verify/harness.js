window.H = (() => {
  const props = ['color','background-color','background-image','font-size','line-height','letter-spacing','font-weight','font-family','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','border-top-color','border-right-color','border-bottom-color','border-left-color','border-top-width','border-top-style','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','row-gap','column-gap','box-shadow','width','height','opacity','z-index','filter','outline-color','outline-width','transition-duration','transition-timing-function','animation-duration','animation-timing-function'];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let fr = {};
  async function setup(width, query = '?reset') {
    document.body.innerHTML = '';
    for (const [k, src] of [['o', '/old/index.html'], ['n', '/new/index.html']]) {
      const f = document.createElement('iframe');
      f.style.cssText = `width:${width}px;height:900px;border:0`; f.src = src + query; document.body.appendChild(f); fr[k] = f;
    }
    await Promise.all(Object.values(fr).map((f) => new Promise((r) => f.addEventListener('load', r))));
    await sleep(800);
    // capture animation/transition values BEFORE freezing so motion tokens are compared too
    return { width };
  }
  const docs = () => [fr.o.contentDocument, fr.n.contentDocument];
  const freeze = (d) => { if (d.getElementById('__f')) return; const s = d.createElement('style'); s.id = '__f'; s.textContent = '*,*::before,*::after{animation-delay:-999s!important;animation-play-state:paused!important}'; d.head.appendChild(s); };
  async function each(fn) { for (const d of docs()) await fn(d, d.defaultView); }
  async function go(hash, wait = 700) { for (const f of Object.values(fr)) f.contentWindow.location.hash = hash; await sleep(wait); }
  async function click(text, sel = 'button,a,[role=button],li,label') {
    let hit = 0;
    for (const d of docs()) { const el = [...d.querySelectorAll(sel)].find((e) => e.textContent.trim().replace(/\s+/g, ' ').startsWith(text) && e.offsetParent !== null); if (el) { el.click(); hit++; } }
    await sleep(600); return hit;
  }
  async function login() {
    await go('#/login');
    for (const d of docs()) {
      const w = d.defaultView, f = d.querySelector('#login-form'); if (!f) throw new Error('no login form');
      const set = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
      set(f.querySelector('input[type=email]'), 'demo@example.test'); set(f.querySelector('input[type=password]'), 'demo-pass-1');
      f.querySelector('button[type=submit]').click();
    }
    await sleep(900);
    for (const d of docs()) { const b = [...d.querySelectorAll('button,a')].find((e) => e.textContent.trim().startsWith('JDJohn')); if (b) b.click(); }
    await sleep(900);
  }
  const clampR = (v, e) => { if (!v.endsWith('px')) return v; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return 'hidden'; const cap = Math.min(r.width, r.height) / 2; return Math.min(parseFloat(v), cap || 1e9).toFixed(1) + 'px'; };
  function collect(d) {
    freeze(d); const w = d.defaultView; const out = [];
    d.querySelectorAll('body *').forEach((e, i) => {
      const cs = w.getComputedStyle(e);
      out.push({ k: i + '|' + e.tagName + '.' + (typeof e.className === 'string' ? e.className : ''), v: props.map((p) => { let v = cs.getPropertyValue(p); if (p.includes('radius')) v = clampR(v.split(' ')[0], e); return v; }) });
    });
    return out;
  }
  const seen = {};
  async function diff(label) {
    await sleep(300);
    const [a, b] = docs().map(collect); const diffs = [];
    if (a.length !== b.length) diffs.push('element count ' + a.length + ' vs ' + b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++) for (let j = 0; j < props.length; j++) if (a[i].v[j] !== b[i].v[j]) diffs.push(a[i].k.slice(0, 50) + ' :: ' + props[j] + ' :: ' + a[i].v[j].slice(0, 50) + ' => ' + b[i].v[j].slice(0, 50));
    const byProp = {}; diffs.forEach((d) => { const p = d.split(' :: ')[1] || 'count'; byProp[p] = (byProp[p] || 0) + 1; });
    return { view: label, elements: a.length, differences: diffs.length, byProp, sample: diffs.slice(0, 6) };
  }
  return { setup, go, click, login, diff, docs, sleep };
})();
H.suite = async (desk) => {
  const out = []; const D = async (l) => { const r = await H.diff(l); out.push(r); return r; };
  const Q = 'Plan a 5 day trip to Tokyo';
  await H.go('#/'); await D('guest home');
  await H.go('#/signup'); await D('signup');
  await H.go('#/login'); await D('login');
  await H.go('#/explore'); await D('gate (guest explore)');
  await H.go('#/results?q=' + encodeURIComponent(Q), 1800); await D('guest results');
  await H.go('#/answer/openai?q=' + encodeURIComponent(Q), 1200); await D('guest answer');
  await H.login();
  await H.go('#/'); await D('home');
  await H.go('#/results?q=' + encodeURIComponent(Q), 1800); await D('results');
  await H.go('#/answer/openai?q=' + encodeURIComponent(Q), 1200); await D('answer');
  if (desk) { await H.go('#/compare?q=' + encodeURIComponent(Q) + '&a=openai&b=gemini', 1800); await D('compare'); }
  await H.go('#/chats'); await D('saved');
  await H.go('#/chats/folder/japan'); await D('folder');
  await H.go('#/chat/ds'); await D('chat ds');
  await H.go('#/chat/party'); await D('chat party');
  await H.go('#/explore'); await D('explore');
  const hit = await H.click('Code Master', 'li,button,a,[role=button],article,div'); await D('agent popup (hit ' + hit + ')');
  await H.go('#/agents'); await D('my agents');
  await H.go('#/agents/build'); await D('agent builder');
  await H.go('#/'); await H.click('JD', 'button'); await D('avatar menu');
  return { views: out.length, total: out.reduce((a, r) => a + r.differences, 0), elements: out.reduce((a, r) => a + r.elements, 0), failing: out.filter((r) => r.differences).map((r) => ({ view: r.view, n: r.differences, sample: r.sample.slice(0, 3) })) };
};
