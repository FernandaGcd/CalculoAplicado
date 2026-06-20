let chart;
let currentFn = 'sin';

// ─── DEFINICIÓN DE FUNCIONES ───────────────────────────────────────────────

const fnDefs = {
  sin: {
    f: x => Math.sin(x),
    label: 'sin(x)',
    coeff: (k, a) => {
      const cycle = [Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)];
      return cycle[((k % 4) + 4) % 4];
    }
  },
  cos: {
    f: x => Math.cos(x),
    label: 'cos(x)',
    coeff: (k, a) => {
      const cycle = [Math.cos(a), -Math.sin(a), -Math.cos(a), Math.sin(a)];
      return cycle[((k % 4) + 4) % 4];
    }
  },
  exp: {
    f: x => Math.exp(x),
    label: 'eˣ',
    coeff: (k, a) => Math.exp(a)
  },
  ln: {
    f: x => Math.log(1 + x),
    label: 'ln(1+x)',
    coeff: (k, a) => {
      if (k === 0) return Math.log(1 + a);
      return Math.pow(-1, k + 1) * fact(k - 1) / Math.pow(1 + a, k);
    }
  },
  atan: {
    f: x => Math.atan(x),
    label: 'arctan(x)',
    coeff: (k, a) => atanDeriv(k, a)
  },
  sinh: {
    f: x => Math.sinh(x),
    label: 'sinh(x)',
    coeff: (k, a) => k % 2 === 0 ? Math.sinh(a) : Math.cosh(a)
  }
};

// ─── UTILIDADES ───────────────────────────────────────────────────────────

function fact(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function atanDeriv(n, a) {
  if (n === 0) return Math.atan(a);
  const h = 1e-5;
  if (n === 1) return 1 / (1 + a * a);
  return (atanDeriv(n - 1, a + h) - atanDeriv(n - 1, a - h)) / (2 * h);
}

function evalTaylor(fn, x, a, n) {
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    const c = fn.coeff(k, a) / fact(k);
    sum += c * Math.pow(x - a, k);
  }
  return sum;
}

// ─── FORMATEO DE FÓRMULA ──────────────────────────────────────────────────

function fmtTerm(coef, k, a) {
  const v = parseFloat(coef.toFixed(5));
  if (Math.abs(v) < 1e-10) return null;

  const sign = v >= 0 ? '+' : '-';
  const abs = Math.abs(v).toFixed(4).replace(/\.?0+$/, '');

  let xpart = '';
  if (k === 0) return `${v >= 0 ? '' : '-'}${abs}`;
  if (k === 1) xpart = a === 0 ? 'x' : `(x - ${a})`;
  else xpart = a === 0 ? `x^{${k}}` : `(x - ${a})^{${k}}`;

  const coefStr = abs === '1' ? '' : abs + ' \\cdot ';
  return ` ${sign} ${coefStr}${xpart}`;
}

function buildFormula(fn, a, n) {
  const terms = [];
  for (let k = 0; k <= Math.min(n, 6); k++) {
    const c = fn.coeff(k, a) / fact(k);
    const t = fmtTerm(c, k, a);
    if (t !== null) terms.push(t);
  }
  if (n > 6) terms.push(' + \\cdots');
  const poly = terms.length ? terms.join(' ') : '0';
  return `\\[T(x) = ${poly}\\]`;
}

// ─── PASOS ────────────────────────────────────────────────────────────────

function buildPasos(fn, a, n) {
  let html = `\\[T(x) = \\sum_{k=0}^{${n}} \\frac{f^{(k)}(${a})}{k!}(x - ${a})^k\\]`;
  html += `<table class="pasos-tabla">`;
  const lim = Math.min(n, 7);
  for (let k = 0; k <= lim; k++) {
    const d = fn.coeff(k, a);
    const c = d / fact(k);
    html += `<tr>
      <td>\\(k=${k}\\)</td>
      <td>\\(f^{(${k})}(${a}) = ${d.toFixed(4)}\\)</td>
      <td>\\(\\div ${fact(k)}\\)</td>
      <td>\\(= ${c.toFixed(5)}\\)</td>
    </tr>`;
  }
  if (n > 7) {
    html += `<tr><td colspan="4" class="mas-terminos">... (${n - 7} términos más)</td></tr>`;
  }
  html += `</table>`;
  return html;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────

function calcular() {
  const fn = fnDefs[currentFn];
  const n = parseInt(document.getElementById('nSlider').value);
  const a = parseFloat(document.getElementById('aSlider').value);
  const xv = parseFloat(document.getElementById('xSlider').value);

  document.getElementById('nVal').textContent = n;
  document.getElementById('aVal').textContent = a;
  document.getElementById('xVal').textContent = xv.toFixed(1);

  // Valores
  let exact;
  try { exact = fn.f(xv); } catch (e) { exact = NaN; }
  const approx = evalTaylor(fn, xv, a, n);
  const errAbs = Math.abs(exact - approx);
  const errRel = Math.abs(exact) > 1e-12 ? (errAbs / Math.abs(exact) * 100) : 0;

  document.getElementById('exactVal').textContent  = isNaN(exact) ? '—' : exact.toFixed(6);
  document.getElementById('approxVal').textContent = approx.toFixed(6);
  document.getElementById('errAbs').textContent    = isNaN(exact) ? '—' : errAbs.toFixed(7);
  document.getElementById('errRel').textContent    = isNaN(exact) ? '—' : errRel.toFixed(4) + '%';

  // Fórmula y pasos
  document.getElementById('formulaBox').innerHTML = buildFormula(fn, a, n);
  document.getElementById('pasosBox').innerHTML   = buildPasos(fn, a, n);

  MathJax.typesetPromise();

  graficar(fn, a, n, xv);
}

// ─── GRÁFICA ──────────────────────────────────────────────────────────────

function graficar(fn, a, n, xv) {
  const N = 300;
  const xmin = -5, xmax = 5;
  const step = (xmax - xmin) / N;

  const labels = [], yExact = [], yTaylor = [];

  for (let i = 0; i <= N; i++) {
    const x = xmin + i * step;
    labels.push(x.toFixed(2));

    let ye;
    try { ye = fn.f(x); } catch (e) { ye = null; }
    if (ye !== null && (isNaN(ye) || Math.abs(ye) > 20)) ye = null;

    const yt = evalTaylor(fn, x, a, n);
    yExact.push(ye);
    yTaylor.push(Math.abs(yt) > 20 ? null : yt);
  }

  // Punto evaluado
  const approxPt = evalTaylor(fn, xv, a, n);
  const puntoData = labels.map(l => Math.abs(parseFloat(l) - xv) < 0.02 ? approxPt : null);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('grafica'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'f(x) exacta',
          data: yExact,
          borderColor: '#5DCAA5',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.3,
          spanGaps: false
        },
        {
          label: 'Taylor T(x)',
          data: yTaylor,
          borderColor: '#c084fc',
          borderWidth: 2.5,
          borderDash: [8, 5],
          pointRadius: 0,
          tension: 0.3,
          spanGaps: false
        },
        {
          label: 'Punto x',
          data: puntoData,
          borderColor: '#f97316',
          backgroundColor: '#f97316',
          pointRadius: 7,
          pointStyle: 'circle',
          type: 'scatter',
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: 'white', usePointStyle: true }
        }
      },
      scales: {
        x: {
          grid: { color: '#8d7ba4' },
          ticks: { color: 'white', maxTicksLimit: 11 },
          title: { display: true, text: 'x', color: 'white' }
        },
        y: {
          grid: { color: '#8d7ba4' },
          ticks: { color: 'white' },
          title: { display: true, text: 'y', color: 'white' },
          min: -8, max: 8
        }
      }
    }
  });
}

// ─── CAMBIO DE FUNCIÓN ────────────────────────────────────────────────────

function setFn(el, name) {
  document.querySelectorAll('.func-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentFn = name;
  calcular();
}

// Iniciar
calcular();
