(() => {
  const exprEl = document.getElementById('expr');
  const outEl = document.getElementById('out');
  const historyEl = document.getElementById('history');
  const modeBtn = document.getElementById('mode');
  const equalsBtn = document.getElementById('equals');

  let expression = '';
  let memory = 0;
  let ans = 0;
  let deg = true;
  let history = [];

  function refresh() {
    exprEl.textContent = expression || '';
    outEl.textContent = expression ? expression : '0';
  }

  function pushHistory(q, r) {
    history.unshift({q,r});
    if (history.length>30) history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyEl.innerHTML = '';
    history.forEach((h) => {
      const div = document.createElement('div');
      div.className = 'hist-item';
      div.innerHTML = `<div style="opacity:.9">${h.q}</div><div style="color:var(--accent);font-weight:700">${h.r}</div>`;
      div.addEventListener('click', () => { expression = h.r; refresh(); });
      historyEl.appendChild(div);
    });
  }

  function safeEval(expr) {
    // token replacements
    let s = expr.replace(/π|pi/g,'Math.PI').replace(/\be\b/g,'Math.E');
    s = s.replace(/\^/g,'**');
    s = s.replace(/(\d+(\.\d+)?|\))!/g, (m) => `fact(${m.slice(0,-1)})`);
    s = s.replace(/\b(sin|cos|tan)\s*\(/g, (m, p1) => `trig('${p1}', `);
    s = s.replace(/\bln\(/g,'Math.log(');
    s = s.replace(/\blog\(/g,typeof Math.log10 === 'function' ? 'Math.log10(' : 'log10(');
    s = s.replace(/\bsqrt\(/g,'Math.sqrt(');
    s = s.replace(/\bexp\(/g,'Math.exp(');

    const currentANS = ans;
    const fnBody = `${typeof Math.log10 === 'function' ? '' : 'function log10(x){return Math.log(x)/Math.LN10;}'}` +
      `function trig(fn,x){return deg ? Math[fn](toRad(x)) : Math[fn](x);}` +
      `return (${s});`;
    const wrapperFn = new Function('Math','toRad','fact','ANS','deg', fnBody);

    try {
      const result = wrapperFn(Math, toRad, fact, currentANS, deg);
      if (!isFinite(result)) throw new Error('Result not finite');
      return result;
    } catch (e) {
      throw e;
    }
  }

  function fact(n){
    n = Number(n);
    if (!Number.isFinite(n) || n < 0) return NaN;
    if (Math.floor(n) !== n) return gamma(n+1);
    let res=1;
    for(let i=2;i<=n;i++) res*=i;
    return res;
  }
  function gamma(z){
    const g = 7;
    const p = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(z<0.5) return Math.PI/(Math.sin(Math.PI*z)*gamma(1-z));
    z -= 1;
    let x = p[0];
    for(let i=1;i<p.length;i++) x += p[i]/(z+i);
    const t = z + g + 0.5;
    return Math.sqrt(2*Math.PI)*Math.pow(t, z+0.5)*Math.exp(-t)*x;
  }
  function toRad(x){ return (Number(x))*Math.PI/180; }
  function toDeg(x){ return (Number(x))*180/Math.PI; }

  document.querySelectorAll('button[data-val]').forEach(btn=>{
    btn.addEventListener('click',()=> {
      const v = btn.getAttribute('data-val');
      expression += v;
      refresh();
    });
  });

  document.querySelectorAll('button[data-fn]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const fn = btn.getAttribute('data-fn');
      if(fn==='clear'){ expression=''; outEl.textContent='0'; refresh(); }
      else if(fn==='back'){ expression = expression.slice(0,-1); refresh(); }
      else if(fn==='sqrt'){ expression += 'sqrt('; refresh(); }
      else if(fn==='ln'){ expression += 'ln('; refresh(); }
      else if(fn==='log'){ expression += 'log('; refresh(); }
      else if(fn==='exp'){ expression += 'exp('; refresh(); }
      else if(fn==='fact'){ expression += '!'; refresh(); }
      else if(fn==='mc'){ memory = 0; }
      else if(fn==='mplus'){ try{ memory += Number(evaluateCurrent()); }catch(e){} }
      else if(fn==='mminus'){ try{ memory -= Number(evaluateCurrent()); }catch(e){} }
      else if(fn==='mr'){ expression += String(memory); refresh(); }
      else if(fn==='ans'){ expression += String(ans); refresh(); }
    });
  });

  equalsBtn.addEventListener('click', () => {
    try {
      const r = evaluateCurrent();
      outEl.textContent = String(r);
      pushHistory(expression || '', String(r));
      ans = r;
      expression = String(r);
      refresh();
    } catch (e) {
      outEl.textContent = 'Error';
    }
  });

  function evaluateCurrent(){
    if (!expression) return 0;
    return safeEval(expression);
  }

  window.addEventListener('keydown',(e)=>{
    if(e.key.match(/^[0-9]$/)) expression += e.key;
    else if(e.key === '.') expression += '.';
    else if(e.key === 'Enter') { equalsBtn.click(); e.preventDefault(); }
    else if(e.key === 'Backspace') document.querySelector('button[data-fn="back"]').click();
    else if(e.key === 'Escape') document.querySelector('button[data-fn="clear"]').click();
    else if(e.key === '+') expression += '+';
    else if(e.key === '-') expression += '-';
    else if(e.key === '*') expression += '*';
    else if(e.key === '/') expression += '/';
    else if(e.key === '%') expression += '%';
    else if(e.key === '^') expression += '^';
    refresh();
  });

  modeBtn.addEventListener('click', () => {
    deg = !deg;
    modeBtn.textContent = deg ? 'DEG' : 'RAD';
  });

  document.getElementById('clearHist').addEventListener('click', () => {
    history = []; renderHistory();
  });

  refresh();
})();
