window.__collect = async function (label) {
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
  document.head.appendChild(st);
  await new Promise(r => setTimeout(r, 700));
  const props = ['color','background-color','background-image','font-size','line-height','letter-spacing','font-weight','font-family','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','border-top-color','border-right-color','border-bottom-color','border-left-color','border-top-width','border-top-style','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','row-gap','column-gap','box-shadow','width','height','opacity','z-index','filter','outline-color'];
  const out = [];
  document.querySelectorAll('body *').forEach((e, i) => {
    const cs = getComputedStyle(e);
    const cls = typeof e.className === 'string' ? e.className : '';
    out.push({ k: i + '|' + e.tagName + '.' + cls, v: props.map(p => cs.getPropertyValue(p)) });
  });
  const key = 'cmp-' + innerWidth;
  const rec = { label, n: out.length, out };
  const other = JSON.parse(localStorage.getItem(key + '-' + (label === 'old' ? 'new' : 'old')) || 'null');
  localStorage.setItem(key + '-' + label, JSON.stringify(rec));
  if (!other) return { stored: label, width: innerWidth, elements: out.length };
  const a = label === 'old' ? rec : other, b = label === 'old' ? other : rec;
  const diffs = [];
  if (a.n !== b.n) diffs.push('element count ' + a.n + ' vs ' + b.n);
  for (let i = 0; i < Math.min(a.n, b.n); i++) {
    for (let j = 0; j < props.length; j++) {
      if (a.out[i].v[j] !== b.out[i].v[j]) diffs.push(a.out[i].k.slice(0, 60) + ' :: ' + props[j] + ' :: ' + a.out[i].v[j].slice(0, 60) + ' => ' + b.out[i].v[j].slice(0, 60));
    }
  }
  return { width: innerWidth, elements: a.n, differences: diffs.length, sample: diffs.slice(0, 25) };
};
