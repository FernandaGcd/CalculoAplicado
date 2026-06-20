const limiteInferior = document.getElementById('limiteInferior');
const limiteSuperior = document.getElementById('limiteSuperior');
const integrando = document.getElementById('integrando');

const integralRender = document.getElementById('integralRender');
const analizar = document.getElementById('analizar');
const pasos = document.getElementById('pasos');
const resumen = document.getElementById('resumen');

let campoActivo = integrando;

/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

function latexCampo(campo) {
    return campo.value.trim();
}

function renderizarMathJax() {
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetClear();
        MathJax.typesetPromise();
    }
}

function prepararCampos() {
    const campos = [limiteInferior, limiteSuperior, integrando];

    campos.forEach(campo => {
        campo.addEventListener('focusin', () => {
            campoActivo = campo;
        });

        campo.addEventListener('input', actualizarVistaIntegral);
    });

    document.querySelectorAll('[data-insert]').forEach(boton => {
        boton.addEventListener('click', () => {
            campoActivo.focus();

            campoActivo.executeCommand([
                'insert',
                boton.dataset.insert
            ]);

            actualizarVistaIntegral();
        });
    });

    document.getElementById('borrarCampo').addEventListener('click', () => {
        campoActivo.value = '';
        campoActivo.focus();
        actualizarVistaIntegral();
    });
}

function actualizarVistaIntegral() {
    const inferior = latexCampo(limiteInferior) || '?';
    const superior = latexCampo(limiteSuperior) || '?';
    const f = latexCampo(integrando) || 'f(x)';

    integralRender.innerHTML =
        `\\[
            I=\\int_{${inferior}}^{${superior}} ${f}\\,dx
        \\]`;

    renderizarMathJax();
}

/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

function normalizar(latex) {
    return latex
        .replaceAll('\\left', '')
        .replaceAll('\\right', '')
        .replaceAll('\\,', '')
        .replaceAll('\\!', '')
        .replaceAll('\\displaystyle', '')
        .replaceAll(' ', '')
        .replaceAll('−', '-')
        .replaceAll('\\cdot', '')
        .replaceAll('\\operatorname{ln}', '\\ln')
        .replaceAll('\\mathrm{e}', 'e')
        .replaceAll('\\operatorname{e}', 'e')
        .replace(/\^\{(-?\d+(?:\.\d+)?)\}/g, '^$1')
        .replace(/e\^\{x\}/g, 'e^x')
        .replace(/e\^\{-x\}/g, 'e^{-x}')
        .replace(/e\^\{-1x\}/g, 'e^{-x}')
        .replace(/x\^\{(\d+)\}/g, 'x^$1')
        .replace(/\\sqrt\{x\}/g, 'sqrt(x)')
        .replace(/\\sqrt\{x\^2([+-]\d+(?:\.\d+)?)\}/g, 'sqrt(x^2$1)');
}

function esInfinitoPositivo(valor) {
    const limpio = normalizar(valor);
    return limpio === '\\infty' || limpio === '+\\infty' || limpio === '∞';
}

function esInfinitoNegativo(valor) {
    const limpio = normalizar(valor);
    return limpio === '-\\infty' || limpio === '-∞';
}

function convertirNumero(valor) {
    const limpio = normalizar(valor);

    if (esInfinitoPositivo(limpio)) return Infinity;
    if (esInfinitoNegativo(limpio)) return -Infinity;

    const fraccion = limpio.match(
        /^\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}$/
    );

    if (fraccion) {
        return Number(fraccion[1]) / Number(fraccion[2]);
    }

    if (limpio === '\\pi') return Math.PI;
    if (limpio === '-\\pi') return -Math.PI;
    if (limpio === '\\frac{\\pi}{2}') return Math.PI / 2;
    if (limpio === '-\\frac{\\pi}{2}') return -Math.PI / 2;

    const numero = Number(limpio);

    return Number.isFinite(numero) ? numero : null;
}

function mostrarNumero(numero) {
    if (numero === Infinity) return '\\infty';
    if (numero === -Infinity) return '-\\infty';

    if (Math.abs(numero - Math.PI) < 1e-10) return '\\pi';
    if (Math.abs(numero + Math.PI) < 1e-10) return '-\\pi';
    if (Math.abs(numero - Math.PI / 2) < 1e-10) return '\\frac{\\pi}{2}';
    if (Math.abs(numero + Math.PI / 2) < 1e-10) return '-\\frac{\\pi}{2}';

    if (Math.abs(numero - Math.round(numero)) < 1e-10) {
        return `${Math.round(numero)}`;
    }

    return numero.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function maximoComunDivisor(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
        const temporal = b;
        b = a % b;
        a = temporal;
    }

    return a;
}

function convertirAFraccion(numero) {
    if (numero === Infinity) return '\\infty';
    if (numero === -Infinity) return '-\\infty';
    if (!Number.isFinite(numero)) return 'No\\ existe';

    if (Math.abs(numero - Math.PI) < 1e-8) return '\\pi';
    if (Math.abs(numero - Math.PI / 2) < 1e-8) return '\\frac{\\pi}{2}';
    if (Math.abs(numero - Math.PI / 4) < 1e-8) return '\\frac{\\pi}{4}';
    if (Math.abs(numero + Math.PI / 2) < 1e-8) return '-\\frac{\\pi}{2}';
    if (Math.abs(numero + Math.PI / 4) < 1e-8) return '-\\frac{\\pi}{4}';

    if (Math.abs(numero - Math.round(numero)) < 1e-10) {
        return `${Math.round(numero)}`;
    }

    for (let denominador = 2; denominador <= 500; denominador++) {
        const numerador = Math.round(numero * denominador);

        if (Math.abs(numero - numerador / denominador) < 1e-9) {
            const divisor = maximoComunDivisor(numerador, denominador);
            const n = numerador / divisor;
            const d = denominador / divisor;

            if (n < 0) {
                return `-\\frac{${Math.abs(n)}}{${d}}`;
            }

            return `\\frac{${n}}{${d}}`;
        }
    }

    return mostrarNumero(numero);
}

/* =========================================================
   PRESENTACIÓN
   ========================================================= */

function colocarResumen(caso, metodo, resultado) {
    resumen.innerHTML = `
        <div class="dato">
            <span>Caso</span>
            <strong>${caso}</strong>
        </div>

        <div class="dato">
            <span>Método</span>
            <strong>${metodo}</strong>
        </div>

        <div class="dato">
            <span>Resultado</span>
            <strong>${resultado}</strong>
        </div>
    `;
}

function nuevoPaso(numero, titulo, explicacion, latex) {
    const paso = document.createElement('article');

    paso.className = 'paso';

    paso.innerHTML = `
        <div class="numero">${numero}</div>

        <div class="contenido-paso">
            <h3>${titulo}</h3>
            <p>${explicacion}</p>

            <div class="latex">
                \\[
                    ${latex}
                \\]
            </div>
        </div>
    `;

    pasos.appendChild(paso);
}

function mostrarSolucion(solucion) {
    pasos.innerHTML = '';

    colocarResumen(
        solucion.caso,
        solucion.metodo,
        solucion.resultado
    );

    solucion.pasos.forEach((paso, indice) => {
        nuevoPaso(
            indice + 1,
            paso.titulo,
            paso.texto,
            paso.latex
        );
    });

    renderizarMathJax();
}

function mostrarNoSoportada(f, inferior, superior) {
    colocarResumen(
        'No determinado',
        'No identificado',
        'Pendiente'
    );

    pasos.innerHTML = `
        <div class="error">
            <h3>Integral aún no reconocida automáticamente</h3>

            <p>
                La integral ingresada fue:
            </p>

            <div class="latex">
                \\[
                    I=\\int_{${inferior}}^{${superior}} ${f}\\,dx
                \\]
            </div>

            <p>
                El simulador reconoce potencias, potencias desplazadas,
                sustituciones cuadráticas, logarítmicas, exponenciales,
                tipo arctan, funciones con raíz y discontinuidades racionales
                básicas.
            </p>
        </div>
    `;

    renderizarMathJax();
}

function casoDeLimites(inferior, superior) {
    if (
        esInfinitoNegativo(inferior) &&
        esInfinitoPositivo(superior)
    ) {
        return 'Caso 1: ambos límites infinitos';
    }

    if (esInfinitoPositivo(superior)) {
        return 'Caso 1: límite superior infinito';
    }

    if (esInfinitoNegativo(inferior)) {
        return 'Caso 1: límite inferior infinito';
    }

    return 'Límites numéricos';
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function puntoDentroIntervalo(punto, a, b) {
    const izquierda = a === -Infinity || a < punto;
    const derecha = b === Infinity || punto < b;

    return izquierda && derecha;
}

function puntoEsExtremoIzquierdo(punto, a) {
    return Number.isFinite(a) && Math.abs(a - punto) < 1e-10;
}

function puntoEsExtremoDerecho(punto, b) {
    return Number.isFinite(b) && Math.abs(b - punto) < 1e-10;
}

function evaluarExpMenosX(x) {
    return -Math.exp(-x);
}

function evaluarXExpMenosX(x) {
    return -(x + 1) * Math.exp(-x);
}

function evaluarX2ExpMenosX(x) {
    return -(x * x + 2 * x + 2) * Math.exp(-x);
}

/* =========================================================
   FAMILIA 1:
   1 / x^p
   ========================================================= */

function leerPotenciaSimple(f) {
    const limpio = normalizar(f);

    let coincidencia = limpio.match(
        /^\\frac\{1\}\{x\^(\d+(?:\.\d+)?)\}$/
    );

    if (coincidencia) {
        return Number(coincidencia[1]);
    }

    coincidencia = limpio.match(/^\\frac\{1\}\{x\}$/);

    if (coincidencia) {
        return 1;
    }

    coincidencia = limpio.match(/^x\^-(\d+(?:\.\d+)?)$/);

    if (coincidencia) {
        return Number(coincidencia[1]);
    }

    return null;
}

function antiderivadaPotenciaSimple(p) {
    if (p === 1) {
        return '\\ln|x|';
    }

    return `\\frac{x^{1-${p}}}{1-${p}}`;
}

function evaluarPotenciaSimple(p, x) {
    if (p === 1) {
        return Math.log(Math.abs(x));
    }

    return Math.pow(x, 1 - p) / (1 - p);
}

function detectarPotenciaSimple(f, inferior, superior) {
    const p = leerPotenciaSimple(f);

    if (p === null) return null;

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const funcion = p === 1
        ? '\\frac{1}{x}'
        : `\\frac{1}{x^{${p}}}`;

    const F = antiderivadaPotenciaSimple(p);

    if (
        puntoDentroIntervalo(0, a, b) &&
        !puntoEsExtremoIzquierdo(0, a) &&
        !puntoEsExtremoDerecho(0, b)
    ) {
        return {
            caso: 'Caso 2: discontinuidad interna en x = 0',
            metodo: 'Regla de potencias',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar el punto problemático',
                    texto: 'El denominador se hace cero cuando \\(x=0\\).',
                    latex:
                        `x^{${p}}=0
                        \\quad\\Rightarrow\\quad
                        x=0`
                },

                {
                    titulo: 'Comprobar su posición',
                    texto: 'El punto problemático está dentro del intervalo de integración.',
                    latex:
                        `${mostrarNumero(a)}
                        <
                        0
                        <
                        ${mostrarNumero(b)}`
                },

                {
                    titulo: 'Separar la integral',
                    texto: 'Al existir una discontinuidad interna, se deben estudiar los dos lados por separado.',
                    latex:
                        `I=
                        \\lim_{r\\to0^-}
                        \\int_{${mostrarNumero(a)}}^{r}
                        ${funcion}\\,dx
                        +
                        \\lim_{s\\to0^+}
                        \\int_{s}^{${mostrarNumero(b)}}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: p === 1
                        ? 'La potencia \\(-1\\) produce un logaritmo.'
                        : 'Se usa la regla de potencias.',
                    latex:
                        `\\int ${funcion}\\,dx
                        =
                        ${F}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'Al acercarse a \\(x=0\\), al menos una parte no da valor finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (puntoEsExtremoIzquierdo(0, a)) {
        return {
            caso: 'Caso 2: discontinuidad en el extremo izquierdo x = 0',
            metodo: 'Regla de potencias',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar la discontinuidad',
                    texto: 'El denominador se anula en el límite inferior.',
                    latex:
                        `x^{${p}}=0
                        \\quad\\Rightarrow\\quad
                        x=0`
                },

                {
                    titulo: 'Reescribir la integral',
                    texto: 'Nos acercamos al extremo izquierdo desde la derecha.',
                    latex:
                        `I=
                        \\lim_{r\\to0^+}
                        \\int_r^{${mostrarNumero(b)}}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se aplica la antiderivada correspondiente.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El límite lateral no es finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (puntoEsExtremoDerecho(0, b)) {
        return {
            caso: 'Caso 2: discontinuidad en el extremo derecho x = 0',
            metodo: 'Regla de potencias',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar la discontinuidad',
                    texto: 'El denominador se anula en el límite superior.',
                    latex:
                        `x^{${p}}=0
                        \\quad\\Rightarrow\\quad
                        x=0`
                },

                {
                    titulo: 'Reescribir la integral',
                    texto: 'Nos acercamos al extremo derecho desde la izquierda.',
                    latex:
                        `I=
                        \\lim_{r\\to0^-}
                        \\int_{${mostrarNumero(a)}}^{r}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se aplica la antiderivada correspondiente.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El límite lateral no es finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (a !== null && b === Infinity && a > 0) {
        if (p === 1) {
            return {
                caso: 'Caso 1: límite superior infinito',
                metodo: 'Integral logarítmica',
                resultado: 'Diverge',

                pasos: [
                    {
                        titulo: 'Reescribir como límite',
                        texto: 'El extremo superior es infinito.',
                        latex:
                            `I=\\lim_{b\\to\\infty}
                            \\int_{${mostrarNumero(a)}}^b
                            \\frac{1}{x}\\,dx`
                    },

                    {
                        titulo: 'Integrar',
                        texto: 'La integral de \\(1/x\\) es logarítmica.',
                        latex:
                            `\\int\\frac{1}{x}\\,dx=\\ln|x|`
                    },

                    {
                        titulo: 'Conclusión',
                        texto: 'El logaritmo crece sin límite.',
                        latex:
                            `\\boxed{\\text{La integral diverge}}`
                    }
                ]
            };
        }

        if (p > 1) {
            const valor = 0 - evaluarPotenciaSimple(p, a);
            const valorLatex = convertirAFraccion(valor);

            return {
                caso: 'Caso 1: límite superior infinito',
                metodo: 'Regla de potencias',
                resultado: `Converge a ${valorLatex}`,

                pasos: [
                    {
                        titulo: 'Reescribir como límite',
                        texto: 'Se sustituye el infinito por una variable.',
                        latex:
                            `I=\\lim_{b\\to\\infty}
                            \\int_{${mostrarNumero(a)}}^b
                            x^{-${p}}\\,dx`
                    },

                    {
                        titulo: 'Integrar',
                        texto: 'Se aplica la regla de potencias.',
                        latex:
                            `\\int x^{-${p}}\\,dx=${F}`
                    },

                    {
                        titulo: 'Evaluar',
                        texto: 'El término al infinito tiende a cero.',
                        latex:
                            `I=\\lim_{b\\to\\infty}
                            \\left[
                            ${F}
                            \\right]_{${mostrarNumero(a)}}^b
                            =
                            ${valorLatex}`
                    },

                    {
                        titulo: 'Conclusión',
                        texto: 'El resultado es finito.',
                        latex:
                            `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
                    }
                ]
            };
        }
    }

    if (Number.isFinite(a) && Number.isFinite(b)) {
        const valor =
            evaluarPotenciaSimple(p, b) -
            evaluarPotenciaSimple(p, a);

        const valorLatex = convertirAFraccion(valor);

        return {
            caso: 'Integral definida sin discontinuidad en el intervalo',
            metodo: 'Regla de potencias',
            resultado: `Valor: ${valorLatex}`,

            pasos: [
                {
                    titulo: 'Revisar discontinuidades',
                    texto: 'La función no existe en \\(x=0\\), pero ese punto no está dentro del intervalo.',
                    latex:
                        `x=0
                        \\notin
                        [${mostrarNumero(a)},${mostrarNumero(b)}]`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se aplica la regla de potencias.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Evaluar',
                    texto: 'Se evalúa la antiderivada en los límites.',
                    latex:
                        `I=
                        \\left[
                        ${F}
                        \\right]_{${mostrarNumero(a)}}^{${mostrarNumero(b)}}
                        =
                        ${valorLatex}`
                }
            ]
        };
    }

    return null;
}

/* =========================================================
   FAMILIA 2:
   A / (mx + c)^p
   ========================================================= */

function leerPotenciaLineal(f) {
    const limpio = normalizar(f);

    const coincidencia = limpio.match(
        /^\\frac\{([+-]?\d+(?:\.\d+)?)\}\{\(([-+]?\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?\)\^(\d+)\}$/
    );

    if (!coincidencia) return null;

    const A = Number(coincidencia[1]);
    const textoM = coincidencia[2];
    const textoC = coincidencia[3] || '0';
    const p = Number(coincidencia[4]);

    let m;

    if (textoM === '' || textoM === '+') {
        m = 1;
    } else if (textoM === '-') {
        m = -1;
    } else {
        m = Number(textoM);
    }

    const c = Number(textoC);

    if (!Number.isFinite(A) || !Number.isFinite(m) || m === 0 || !Number.isFinite(c)) {
        return null;
    }

    return { A, m, c, p };
}

function expresionLineal(m, c) {
    let texto = '';

    if (m === 1) texto = 'x';
    else if (m === -1) texto = '-x';
    else texto = `${m}x`;

    if (c > 0) texto += `+${c}`;
    if (c < 0) texto += `${c}`;

    return texto;
}

function antiderivadaPotenciaLineal(A, m, c, p) {
    const lineal = expresionLineal(m, c);

    if (p === 1) {
        if (A === m) return `\\ln|${lineal}|`;
        return `\\frac{${A}}{${m}}\\ln|${lineal}|`;
    }

    return `-\\frac{${A}}{${m * (p - 1)}(${lineal})^{${p - 1}}}`;
}

function evaluarPotenciaLineal(A, m, c, p, x) {
    const base = m * x + c;

    if (p === 1) {
        return (A / m) * Math.log(Math.abs(base));
    }

    return (A / (m * (1 - p))) * Math.pow(base, 1 - p);
}

function detectarPotenciaLineal(f, inferior, superior) {
    const datos = leerPotenciaLineal(f);

    if (!datos) return null;

    const { A, m, c, p } = datos;

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const lineal = expresionLineal(m, c);
    const puntoProblema = -c / m;
    const puntoLatex = mostrarNumero(puntoProblema);

    const funcion = `\\frac{${A}}{(${lineal})^{${p}}}`;
    const F = antiderivadaPotenciaLineal(A, m, c, p);

    if (
        puntoDentroIntervalo(puntoProblema, a, b) &&
        !puntoEsExtremoIzquierdo(puntoProblema, a) &&
        !puntoEsExtremoDerecho(puntoProblema, b)
    ) {
        return {
            caso: `Caso 2: discontinuidad interna en x = ${puntoLatex}`,
            metodo: 'Sustitución simple',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar el punto problemático',
                    texto: 'Se iguala el denominador a cero.',
                    latex:
                        `(${lineal})^{${p}}=0
                        \\quad\\Rightarrow\\quad
                        ${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Separar la integral',
                    texto: 'Una discontinuidad interna obliga a estudiar los dos lados.',
                    latex:
                        `I=
                        \\lim_{r\\to ${puntoLatex}^{-}}
                        \\int_{${mostrarNumero(a)}}^{r}
                        ${funcion}\\,dx
                        +
                        \\lim_{s\\to ${puntoLatex}^{+}}
                        \\int_{s}^{${mostrarNumero(b)}}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Sustitución',
                    texto: 'Se sustituye la expresión lineal del denominador.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Antiderivada',
                    texto: 'Se integra la potencia negativa.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'Al menos una parte no tiene valor finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (puntoEsExtremoIzquierdo(puntoProblema, a)) {
        return {
            caso: `Caso 2: discontinuidad en el extremo izquierdo x = ${puntoLatex}`,
            metodo: 'Sustitución simple',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar la discontinuidad',
                    texto: 'El denominador se anula en el límite inferior.',
                    latex:
                        `${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Reescribir con límite lateral',
                    texto: 'Nos acercamos desde dentro del intervalo.',
                    latex:
                        `I=
                        \\lim_{r\\to ${puntoLatex}^{+}}
                        \\int_r^{${mostrarNumero(b)}}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Antiderivada',
                    texto: 'Se aplica sustitución simple.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El límite lateral no es finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (puntoEsExtremoDerecho(puntoProblema, b)) {
        return {
            caso: `Caso 2: discontinuidad en el extremo derecho x = ${puntoLatex}`,
            metodo: 'Sustitución simple',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar la discontinuidad',
                    texto: 'El denominador se anula en el límite superior.',
                    latex:
                        `${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Reescribir con límite lateral',
                    texto: 'Nos acercamos desde dentro del intervalo.',
                    latex:
                        `I=
                        \\lim_{r\\to ${puntoLatex}^{-}}
                        \\int_{${mostrarNumero(a)}}^{r}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Antiderivada',
                    texto: 'Se aplica sustitución simple.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El límite lateral no es finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (Number.isFinite(a) && Number.isFinite(b)) {
        const valor =
            evaluarPotenciaLineal(A, m, c, p, b) -
            evaluarPotenciaLineal(A, m, c, p, a);

        const valorLatex = convertirAFraccion(valor);

        return {
            caso: 'Integral definida sin discontinuidad en el intervalo',
            metodo: 'Sustitución simple',
            resultado: `Valor: ${valorLatex}`,

            pasos: [
                {
                    titulo: 'Revisar puntos problemáticos',
                    texto: 'Se revisa dónde el denominador se anula.',
                    latex:
                        `${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Comprobar el intervalo',
                    texto: 'El punto problemático no está dentro del intervalo.',
                    latex:
                        `${puntoLatex}
                        \\notin
                        [${mostrarNumero(a)},${mostrarNumero(b)}]`
                },

                {
                    titulo: 'Sustitución',
                    texto: 'Se sustituye la expresión lineal.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se obtiene la antiderivada.',
                    latex:
                        `\\int ${funcion}\\,dx=${F}`
                },

                {
                    titulo: 'Evaluar',
                    texto: 'Se evalúa en los límites.',
                    latex:
                        `I=
                        \\left[
                        ${F}
                        \\right]_{${mostrarNumero(a)}}^{${mostrarNumero(b)}}
                        =
                        ${valorLatex}`
                }
            ]
        };
    }

    return null;
}

/* =========================================================
   FAMILIA 3:
   x / (1 + x²)²
   ========================================================= */

function detectarCuadratica(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{x}{(1+x^2)^2}',
        '\\frac{x}{(x^2+1)^2}'
    ];

    if (!formasAceptadas.includes(limpio)) return null;

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const F = '-\\frac{1}{2(1+x^2)}';

    if (Number.isFinite(a) && Number.isFinite(b)) {
        const valor =
            -1 / (2 * (1 + b * b)) -
            (-1 / (2 * (1 + a * a)));

        const valorLatex = convertirAFraccion(valor);

        return {
            caso: 'Integral definida',
            metodo: 'Sustitución simple',
            resultado: `Valor: ${valorLatex}`,

            pasos: [
                {
                    titulo: 'Sustitución',
                    texto: 'Se toma la expresión interna del denominador.',
                    latex:
                        `u=1+x^2,
                        \\qquad
                        du=2x\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se convierte en una potencia negativa.',
                    latex:
                        `\\int\\frac{x}{(1+x^2)^2}\\,dx
                        =
                        ${F}`
                },

                {
                    titulo: 'Evaluar',
                    texto: 'Se sustituyen los límites dados.',
                    latex:
                        `I=
                        \\left[
                        ${F}
                        \\right]_{${mostrarNumero(a)}}^{${mostrarNumero(b)}}
                        =
                        ${valorLatex}`
                }
            ]
        };
    }

    if (Number.isFinite(a) && b === Infinity) {
        const valor = 0 - (-1 / (2 * (1 + a * a)));
        const valorLatex = convertirAFraccion(valor);

        return {
            caso: 'Caso 1: límite superior infinito',
            metodo: 'Sustitución simple',
            resultado: `Converge a ${valorLatex}`,

            pasos: [
                {
                    titulo: 'Reescribir como límite',
                    texto: 'El límite superior es infinito.',
                    latex:
                        `I=
                        \\lim_{b\\to\\infty}
                        \\int_{${mostrarNumero(a)}}^b
                        \\frac{x}{(1+x^2)^2}\\,dx`
                },

                {
                    titulo: 'Sustitución',
                    texto: 'Se usa \\(u=1+x^2\\).',
                    latex:
                        `u=1+x^2,
                        \\qquad
                        du=2x\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'La antiderivada es una potencia negativa.',
                    latex:
                        `\\int\\frac{x}{(1+x^2)^2}\\,dx=${F}`
                },

                {
                    titulo: 'Evaluar',
                    texto: 'El término con \\(b\\) tiende a cero.',
                    latex:
                        `I=
                        \\lim_{b\\to\\infty}
                        \\left[
                        ${F}
                        \\right]_{${mostrarNumero(a)}}^b
                        =
                        ${valorLatex}`
                }
            ]
        };
    }

    return null;
}

/* =========================================================
   FAMILIA 4:
   1 / [x(ln x)^p]
   ========================================================= */

function detectarLogaritmica(f, inferior, superior) {
    const limpio = normalizar(f);

    const coincidencia =
        limpio.match(
            /^\\frac\{1\}\{x\(\\ln\(x\)\)\^(\d+)\}$/
        ) ||
        limpio.match(
            /^\\frac\{1\}\{x\\ln\^(\d+)\(x\)\}$/
        );

    if (!coincidencia || !esInfinitoPositivo(superior)) return null;

    const p = Number(coincidencia[1]);

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo: 'Sustitución simple',
        resultado: p > 1 ? 'Converge' : 'Diverge',

        pasos: [
            {
                titulo: 'Reescribir como límite',
                texto: 'El límite superior es infinito.',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\int_{${inferior}}^b
                    \\frac{1}{x(\\ln x)^{${p}}}\\,dx`
            },

            {
                titulo: 'Sustitución',
                texto: 'Aparecen \\(\\ln x\\) y su derivada.',
                latex:
                    `u=\\ln x,
                    \\qquad
                    du=\\frac{dx}{x}`
            },

            {
                titulo: 'Transformar',
                texto: 'La integral se vuelve una potencia.',
                latex:
                    `\\int
                    \\frac{1}{x(\\ln x)^{${p}}}\\,dx
                    =
                    \\int u^{-${p}}\\,du`
            },

            {
                titulo: 'Conclusión',
                texto: p > 1
                    ? 'La integral converge.'
                    : 'La integral diverge.',
                latex: p > 1
                    ? `\\boxed{\\text{La integral converge porque }p=${p}>1}`
                    : `\\boxed{\\text{La integral diverge porque }p=${p}\\leq1}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 5:
   e^x/(e^x+1)
   ========================================================= */

function detectarExponencialLogaritmica(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{e^x}{e^x+1}',
        '\\frac{e^{x}}{e^{x}+1}'
    ];

    if (!formasAceptadas.includes(limpio) || !esInfinitoPositivo(superior)) {
        return null;
    }

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo: 'Sustitución simple',
        resultado: 'Diverge',

        pasos: [
            {
                titulo: 'Reescribir como límite',
                texto: 'El límite superior es infinito.',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\int_{${inferior}}^b
                    \\frac{e^x}{e^x+1}\\,dx`
            },

            {
                titulo: 'Sustitución',
                texto: 'El numerador es la derivada del denominador.',
                latex:
                    `u=e^x+1,
                    \\qquad
                    du=e^x\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'Se obtiene un logaritmo.',
                latex:
                    `\\int\\frac{e^x}{e^x+1}\\,dx
                    =
                    \\ln(e^x+1)`
            },

            {
                titulo: 'Conclusión',
                texto: 'El logaritmo crece sin límite.',
                latex:
                    `\\boxed{\\text{La integral diverge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 6:
   e^x/(e^{2x}+1)
   ========================================================= */

function detectarExponencialArctan(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{e^x}{e^{2x}+1}',
        '\\frac{e^{x}}{e^{2x}+1}',
        '\\frac{e^x}{(e^x)^2+1}'
    ];

    if (!formasAceptadas.includes(limpio)) return null;

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const ambosInfinitos = a === -Infinity && b === Infinity;
    const ceroAInfinito = a === 0 && b === Infinity;

    let valorLatex = '';
    let resultado = 'Converge';

    if (ambosInfinitos) {
        valorLatex = '\\frac{\\pi}{2}';
        resultado = 'Converge a π/2';
    } else if (ceroAInfinito) {
        valorLatex = '\\frac{\\pi}{4}';
        resultado = 'Converge a π/4';
    }

    return {
        caso: casoDeLimites(inferior, superior),
        metodo: 'Sustitución y forma arctan',
        resultado,

        pasos: [
            {
                titulo: 'Planteamiento',
                texto: ambosInfinitos
                    ? 'Se separa en dos integrales impropias.'
                    : 'Se analiza la integral ingresada.',
                latex: ambosInfinitos
                    ? `I=
                    \\lim_{a\\to-\\infty}
                    \\int_a^0
                    \\frac{e^x}{e^{2x}+1}\\,dx
                    +
                    \\lim_{b\\to\\infty}
                    \\int_0^b
                    \\frac{e^x}{e^{2x}+1}\\,dx`
                    : b === Infinity
                        ? `I=
                        \\lim_{b\\to\\infty}
                        \\int_{${inferior}}^b
                        \\frac{e^x}{e^{2x}+1}\\,dx`
                        : `I=
                        \\int_{${inferior}}^{${superior}}
                        \\frac{e^x}{e^{2x}+1}\\,dx`
            },

            {
                titulo: 'Sustitución',
                texto: 'Con \\(u=e^x\\), aparece la forma \\(1/(1+u^2)\\).',
                latex:
                    `u=e^x,
                    \\qquad
                    du=e^x\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'Se obtiene arco tangente.',
                latex:
                    `\\int\\frac{e^x}{e^{2x}+1}\\,dx
                    =
                    \\arctan(e^x)`
            },

            {
                titulo: 'Evaluar',
                texto: 'Se evalúa la antiderivada en los límites correspondientes.',
                latex: valorLatex !== ''
                    ? `I=${valorLatex}`
                    : `I=
                    \\left[
                    \\arctan(e^x)
                    \\right]_{${inferior}}^{${superior}}`
            },

            {
                titulo: 'Conclusión',
                texto: 'El resultado es finito.',
                latex: valorLatex !== ''
                    ? `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
                    : `\\boxed{\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 7:
   1/(e^x + e^{-x})
   ========================================================= */

function detectarSechExponencial(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{1}{e^x+e^{-x}}',
        '\\frac{1}{e^{x}+e^{-x}}',
        '\\frac{1}{e^x+e^{-1x}}',
        '\\frac{1}{e^{x}+e^{-1x}}',
        '\\frac{1}{e^x+\\frac{1}{e^x}}',
        '\\frac{1}{e^{x}+\\frac{1}{e^{x}}}'
    ];

    if (!formasAceptadas.includes(limpio)) {
        return null;
    }

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const ambosInfinitos = a === -Infinity && b === Infinity;
    const ceroAInfinito = a === 0 && b === Infinity;

    let valorLatex = '';
    let resultado = 'Converge';

    if (ceroAInfinito) {
        valorLatex = '\\frac{\\pi}{4}';
        resultado = 'Converge a π/4';
    }

    if (ambosInfinitos) {
        valorLatex = '\\frac{\\pi}{2}';
        resultado = 'Converge a π/2';
    }

    return {
        caso: casoDeLimites(inferior, superior),
        metodo: 'Transformación exponencial y arctan',
        resultado,

        pasos: [
            {
                titulo: 'Identificar la forma exponencial',
                texto: 'La función contiene \\(e^x\\) y \\(e^{-x}\\).',
                latex:
                    `I=\\int_{${inferior}}^{${superior}}
                    \\frac{1}{e^x+e^{-x}}\\,dx`
            },

            {
                titulo: 'Multiplicar por \\(e^x\\)',
                texto: 'Esto elimina el exponente negativo del denominador.',
                latex:
                    `\\frac{1}{e^x+e^{-x}}
                    \\cdot
                    \\frac{e^x}{e^x}
                    =
                    \\frac{e^x}{e^{2x}+1}`
            },

            {
                titulo: 'Reescribir la integral',
                texto: 'Ahora queda una integral tipo arco tangente.',
                latex: ambosInfinitos
                    ? `I=
                    \\lim_{a\\to-\\infty}
                    \\int_a^0
                    \\frac{e^x}{e^{2x}+1}\\,dx
                    +
                    \\lim_{b\\to\\infty}
                    \\int_0^b
                    \\frac{e^x}{e^{2x}+1}\\,dx`
                    : b === Infinity
                        ? `I=
                        \\lim_{b\\to\\infty}
                        \\int_{${inferior}}^b
                        \\frac{e^x}{e^{2x}+1}\\,dx`
                        : `I=
                        \\int_{${inferior}}^{${superior}}
                        \\frac{e^x}{e^{2x}+1}\\,dx`
            },

            {
                titulo: 'Sustitución',
                texto: 'Se toma \\(u=e^x\\).',
                latex:
                    `u=e^x,
                    \\qquad
                    du=e^x\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'Aparece la forma de arco tangente.',
                latex:
                    `\\int
                    \\frac{e^x}{e^{2x}+1}\\,dx
                    =
                    \\arctan(e^x)`
            },

            {
                titulo: 'Evaluar',
                texto: 'Se evalúa la antiderivada en los límites.',
                latex: valorLatex !== ''
                    ? `I=${valorLatex}`
                    : `I=
                    \\left[
                    \\arctan(e^x)
                    \\right]_{${inferior}}^{${superior}}`
            },

            {
                titulo: 'Conclusión',
                texto: 'El resultado final es finito.',
                latex: valorLatex !== ''
                    ? `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
                    : `\\boxed{\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 8:
   1/(x^2+a^2)
   ========================================================= */

function detectarArctanRacional(f, inferior, superior) {
    const limpio = normalizar(f);

    const coincidencia = limpio.match(
        /^\\frac\{1\}\{x\^2\+(\d+(?:\.\d+)?)\}$/
    );

    if (!coincidencia) return null;

    const a2 = Number(coincidencia[1]);
    const aValor = Math.sqrt(a2);
    const aLatex = convertirAFraccion(aValor);

    const inf = convertirNumero(inferior);
    const sup = convertirNumero(superior);

    let valorLatex = '';

    if (inf === -Infinity && sup === Infinity) {
        valorLatex = `\\frac{\\pi}{${aLatex}}`;
    }

    if (inf === 0 && sup === Infinity) {
        valorLatex = `\\frac{\\pi}{2${aLatex}}`;
    }

    return {
        caso: casoDeLimites(inferior, superior),
        metodo: 'Forma arctan',
        resultado: valorLatex ? `Converge a ${valorLatex}` : 'Converge',

        pasos: [
            {
                titulo: 'Identificar la forma',
                texto: 'El denominador tiene la forma \\(x^2+a^2\\).',
                latex:
                    `x^2+${a2}=x^2+(${aLatex})^2`
            },

            {
                titulo: 'Fórmula',
                texto: 'Se usa la fórmula de arco tangente.',
                latex:
                    `\\int\\frac{1}{x^2+a^2}\\,dx
                    =
                    \\frac{1}{a}
                    \\arctan\\left(\\frac{x}{a}\\right)`
            },

            {
                titulo: 'Antiderivada',
                texto: 'Sustituyendo el valor de \\(a\\).',
                latex:
                    `\\int\\frac{1}{x^2+${a2}}\\,dx
                    =
                    \\frac{1}{${aLatex}}
                    \\arctan\\left(\\frac{x}{${aLatex}}\\right)`
            },

            {
                titulo: 'Evaluar',
                texto: 'Se evalúa en los límites correspondientes.',
                latex: valorLatex
                    ? `I=${valorLatex}`
                    : `I=
                    \\left[
                    \\frac{1}{${aLatex}}
                    \\arctan\\left(\\frac{x}{${aLatex}}\\right)
                    \\right]_{${inferior}}^{${superior}}`
            },

            {
                titulo: 'Conclusión',
                texto: 'El resultado es finito.',
                latex: valorLatex
                    ? `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
                    : `\\boxed{\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 9:
   1/(x^2-a^2)
   ========================================================= */

function detectarDiferenciaCuadrados(f, inferior, superior) {
    const limpio = normalizar(f);

    const coincidencia = limpio.match(
        /^\\frac\{1\}\{x\^2-(\d+(?:\.\d+)?)\}$/
    );

    if (!coincidencia) return null;

    const a2 = Number(coincidencia[1]);
    const aValor = Math.sqrt(a2);
    const aLatex = convertirAFraccion(aValor);

    const inf = convertirNumero(inferior);
    const sup = convertirNumero(superior);

    const punto1 = -aValor;
    const punto2 = aValor;

    const funcion = `\\frac{1}{x^2-${a2}}`;

    if (puntoDentroIntervalo(punto1, inf, sup) || puntoDentroIntervalo(punto2, inf, sup)) {
        return {
            caso: 'Caso 2: discontinuidad interna',
            metodo: 'Fracciones parciales',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Factorizar el denominador',
                    texto: 'Se usa diferencia de cuadrados.',
                    latex:
                        `x^2-${a2}
                        =
                        (x-${aLatex})(x+${aLatex})`
                },

                {
                    titulo: 'Detectar puntos problemáticos',
                    texto: 'El denominador se anula en dos puntos.',
                    latex:
                        `x=${-aValor}
                        \\qquad
                        x=${aValor}`
                },

                {
                    titulo: 'Revisar el intervalo',
                    texto: 'Al menos uno de esos puntos está dentro del intervalo de integración.',
                    latex:
                        `\\text{Existe una discontinuidad dentro de }
                        [${mostrarNumero(inf)},${mostrarNumero(sup)}]`
                },

                {
                    titulo: 'Separar la integral',
                    texto: 'La integral debe partirse en los puntos problemáticos.',
                    latex:
                        `I=\\int_{${inferior}}^{${superior}}
                        ${funcion}\\,dx
                        \\quad\\text{se divide en los puntos donde }x^2-${a2}=0`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'Por la discontinuidad interna, la integral diverge.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    return {
        caso: casoDeLimites(inferior, superior),
        metodo: 'Fracciones parciales',
        resultado: 'Analizable',

        pasos: [
            {
                titulo: 'Factorizar',
                texto: 'Se usa diferencia de cuadrados.',
                latex:
                    `x^2-${a2}=(x-${aLatex})(x+${aLatex})`
            },

            {
                titulo: 'Separar en fracciones parciales',
                texto: 'Se descompone la función racional.',
                latex:
                    `\\frac{1}{x^2-${a2}}
                    =
                    \\frac{1}{2${aLatex}}
                    \\left(
                    \\frac{1}{x-${aLatex}}
                    -
                    \\frac{1}{x+${aLatex}}
                    \\right)`
            },

            {
                titulo: 'Antiderivada',
                texto: 'Se integran términos logarítmicos.',
                latex:
                    `\\int\\frac{1}{x^2-${a2}}\\,dx
                    =
                    \\frac{1}{2${aLatex}}
                    \\ln\\left|
                    \\frac{x-${aLatex}}{x+${aLatex}}
                    \\right|`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 10:
   e^{-x}, xe^{-x}, x²e^{-x}
   ========================================================= */

function detectarExponencialNegativa(f, inferior, superior) {
    const limpio = normalizar(f);

    const inf = convertirNumero(inferior);
    const sup = convertirNumero(superior);

    const esExp = limpio === 'e^{-x}' || limpio === 'e^-x';
    const esXExp = limpio === 'xe^{-x}' || limpio === 'xe^-x' || limpio === 'x*e^{-x}';
    const esX2Exp = limpio === 'x^2e^{-x}' || limpio === 'x^2e^-x' || limpio === 'x^2*e^{-x}';

    if (!esExp && !esXExp && !esX2Exp) return null;
    if (sup !== Infinity) return null;

    let F;
    let valor;
    let metodo;
    let pasosPartes;

    if (esExp) {
        F = '-e^{-x}';
        valor = 0 - evaluarExpMenosX(inf);
        metodo = 'Exponencial directa';
        pasosPartes =
            `\\int e^{-x}\\,dx=-e^{-x}`;
    }

    if (esXExp) {
        F = '-(x+1)e^{-x}';
        valor = 0 - evaluarXExpMenosX(inf);
        metodo = 'Integración por partes';
        pasosPartes =
            `\\int xe^{-x}\\,dx=-(x+1)e^{-x}`;
    }

    if (esX2Exp) {
        F = '-(x^2+2x+2)e^{-x}';
        valor = 0 - evaluarX2ExpMenosX(inf);
        metodo = 'Integración por partes repetida';
        pasosPartes =
            `\\int x^2e^{-x}\\,dx=-(x^2+2x+2)e^{-x}`;
    }

    const valorLatex = convertirAFraccion(valor);

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo,
        resultado: `Converge a ${valorLatex}`,

        pasos: [
            {
                titulo: 'Reescribir como límite',
                texto: 'El límite superior es infinito.',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\int_{${inferior}}^{b}
                    ${f}\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: esExp
                    ? 'La integral es exponencial directa.'
                    : 'Se usa integración por partes.',
                latex: pasosPartes
            },

            {
                titulo: 'Evaluar el límite',
                texto: 'La exponencial \\(e^{-x}\\) tiende a cero cuando \\(x\\to\\infty\\).',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\left[
                    ${F}
                    \\right]_{${inferior}}^b
                    =
                    ${valorLatex}`
            },

            {
                titulo: 'Conclusión',
                texto: 'El resultado es finito.',
                latex:
                    `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 11:
   1/sqrt(x)
   ========================================================= */

function detectarRaizSimple(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{1}{sqrt(x)}',
        '\\frac{1}{\\sqrt{x}}',
        'x^-\\frac{1}{2}',
        'x^{-\\frac{1}{2}}'
    ];

    if (!formasAceptadas.includes(limpio)) return null;

    const inf = convertirNumero(inferior);
    const sup = convertirNumero(superior);

    if (inf !== 0 || !Number.isFinite(sup)) return null;

    const valor = 2 * Math.sqrt(sup);
    const valorLatex = convertirAFraccion(valor);

    return {
        caso: 'Caso 2: discontinuidad en el extremo izquierdo x = 0',
        metodo: 'Regla de potencias',
        resultado: `Converge a ${valorLatex}`,

        pasos: [
            {
                titulo: 'Detectar la discontinuidad',
                texto: 'La función no está definida en \\(x=0\\), que es el límite inferior.',
                latex:
                    `\\frac{1}{\\sqrt{x}}
                    \\quad\\text{no existe en}\\quad
                    x=0`
            },

            {
                titulo: 'Reescribir con límite lateral',
                texto: 'Nos acercamos a cero por la derecha.',
                latex:
                    `I=
                    \\lim_{a\\to0^+}
                    \\int_a^{${superior}}
                    \\frac{1}{\\sqrt{x}}\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'Se escribe como potencia.',
                latex:
                    `\\int x^{-1/2}\\,dx
                    =
                    2\\sqrt{x}`
            },

            {
                titulo: 'Evaluar',
                texto: 'El límite lateral sí produce un valor finito.',
                latex:
                    `I=
                    \\lim_{a\\to0^+}
                    \\left[
                    2\\sqrt{x}
                    \\right]_{a}^{${superior}}
                    =
                    ${valorLatex}`
            },

            {
                titulo: 'Conclusión',
                texto: 'Aunque es impropia, converge.',
                latex:
                    `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 12:
   1/[x sqrt(x²-a²)]
   ========================================================= */

function detectarTrigonometricaRaiz(f, inferior, superior) {
    const limpio = normalizar(f);

    const coincidencia = limpio.match(
        /^\\frac\{1\}\{xsqrt\(x\^2-(\d+(?:\.\d+)?)\)\}$/
    );

    if (!coincidencia) return null;

    const a2 = Number(coincidencia[1]);
    const aValor = Math.sqrt(a2);
    const aLatex = convertirAFraccion(aValor);

    const inf = convertirNumero(inferior);
    const sup = convertirNumero(superior);

    if (inf !== aValor || sup !== Infinity) return null;

    const valorLatex = `\\frac{\\pi}{2${aLatex}}`;

    return {
        caso: `Caso mixto: discontinuidad en x = ${aLatex} y límite superior infinito`,
        metodo: 'Sustitución trigonométrica',
        resultado: `Converge a ${valorLatex}`,

        pasos: [
            {
                titulo: 'Detectar el caso',
                texto: 'La raíz se anula en el extremo izquierdo y el límite superior es infinito.',
                latex:
                    `\\sqrt{x^2-${a2}}=0
                    \\quad\\Rightarrow\\quad
                    x=${aLatex}`
            },

            {
                titulo: 'Reescribir como integral impropia',
                texto: 'Se usa límite lateral en el extremo izquierdo y límite al infinito.',
                latex:
                    `I=
                    \\lim_{c\\to ${aLatex}^{+}}
                    \\lim_{b\\to\\infty}
                    \\int_c^b
                    \\frac{1}{x\\sqrt{x^2-${a2}}}\\,dx`
            },

            {
                titulo: 'Sustitución trigonométrica',
                texto: 'Para \\(\\sqrt{x^2-a^2}\\), se usa \\(x=a\\sec\\theta\\).',
                latex:
                    `x=${aLatex}\\sec\\theta,
                    \\qquad
                    dx=${aLatex}\\sec\\theta\\tan\\theta\\,d\\theta`
            },

            {
                titulo: 'Simplificar',
                texto: 'La integral se reduce a una constante.',
                latex:
                    `\\frac{dx}{x\\sqrt{x^2-${a2}}}
                    =
                    \\frac{1}{${aLatex}}\\,d\\theta`
            },

            {
                titulo: 'Evaluar',
                texto: 'Cuando \\(x=${aLatex}\\), \\(\\theta=0\\). Cuando \\(x\\to\\infty\\), \\(\\theta\\to\\pi/2\\).',
                latex:
                    `I=
                    \\frac{1}{${aLatex}}
                    \\int_0^{\\pi/2}d\\theta
                    =
                    ${valorLatex}`
            },

            {
                titulo: 'Conclusión',
                texto: 'El resultado es finito.',
                latex:
                    `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 13:
   1/(1-x)
   ========================================================= */

function detectarDiscontinuidadBasica(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{1}{1-x}',
        '\\frac{1}{-x+1}'
    ];

    if (!formasAceptadas.includes(limpio)) return null;

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    if (!puntoDentroIntervalo(1, a, b)) return null;

    return {
        caso: 'Caso 2: discontinuidad interna en x = 1',
        metodo: 'Sustitución simple / logaritmo',
        resultado: 'Diverge',

        pasos: [
            {
                titulo: 'Detectar el punto problemático',
                texto: 'El denominador se iguala a cero.',
                latex:
                    `1-x=0
                    \\quad\\Rightarrow\\quad
                    x=1`
            },

            {
                titulo: 'Separar la integral',
                texto: 'El punto problemático está dentro del intervalo.',
                latex:
                    `I=
                    \\lim_{r\\to1^-}
                    \\int_{${mostrarNumero(a)}}^r
                    \\frac{1}{1-x}\\,dx
                    +
                    \\lim_{s\\to1^+}
                    \\int_s^{${mostrarNumero(b)}}
                    \\frac{1}{1-x}\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'La antiderivada es logarítmica.',
                latex:
                    `\\int\\frac{1}{1-x}\\,dx
                    =
                    -\\ln|1-x|`
            },

            {
                titulo: 'Conclusión',
                texto: 'Una parte diverge, por lo tanto toda la integral diverge.',
                latex:
                    `\\boxed{\\text{La integral diverge}}`
            }
        ]
    };
}
/* =========================================================
   DETECTOR GLOBAL DE DISCONTINUIDADES INTERNAS
   Se ejecuta antes que todos los detectores particulares.
   Si una familia reconocida tiene un punto problemático dentro
   del intervalo, parte la integral automáticamente.
   ========================================================= */

function agregarPuntoProblematico(lista, valor, latex, motivo) {
    if (!Number.isFinite(valor)) return;

    const existe = lista.some(p => Math.abs(p.valor - valor) < 1e-10);

    if (!existe) {
        lista.push({
            valor,
            latex,
            motivo
        });
    }
}

function obtenerPuntosProblematicos(f) {
    const limpio = normalizar(f);
    const puntos = [];

    /*
        Familia: 1/x^p
        Problema en x = 0
    */

    if (typeof leerPotenciaSimple === 'function') {
        const p = leerPotenciaSimple(f);

        if (p !== null) {
            agregarPuntoProblematico(
                puntos,
                0,
                '0',
                `x^{${p}}=0\\Rightarrow x=0`
            );
        }
    }

    /*
        Familia: A/(mx+c)^p
        Problema en mx+c = 0
    */

    if (typeof leerPotenciaLineal === 'function') {
        const datosLineal = leerPotenciaLineal(f);

        if (datosLineal) {
            const { m, c, p } = datosLineal;
            const punto = -c / m;
            const lineal = expresionLineal(m, c);

            agregarPuntoProblematico(
                puntos,
                punto,
                mostrarNumero(punto),
                `(${lineal})^{${p}}=0\\Rightarrow ${lineal}=0\\Rightarrow x=${mostrarNumero(punto)}`
            );
        }
    }

    /*
        Familia: 1/[x(ln x)^p]
        Problema principal en ln x = 0 => x = 1
        Además x = 0 puede ser extremo problemático por dominio,
        pero para partir internamente el punto clave es x = 1.
    */

    const esLogaritmica =
        limpio.match(/^\\frac\{1\}\{x\(\\ln\(x\)\)\^(\d+(?:\.\d+)?)\}$/) ||
        limpio.match(/^\\frac\{1\}\{x\\ln\^(\d+(?:\.\d+)?)\(x\)\}$/) ||
        limpio.match(/^\\frac\{1\}\{x\(ln\(x\)\)\^(\d+(?:\.\d+)?)\}$/);

    if (esLogaritmica) {
        agregarPuntoProblematico(
            puntos,
            1,
            '1',
            `\\ln x=0\\Rightarrow x=e^0=1`
        );
    }

    /*
        Familia: 1/(1-x)
        Problema en x = 1
    */

    const esUnoSobreUnoMenosX =
        limpio === '\\frac{1}{1-x}' ||
        limpio === '\\frac{1}{-x+1}';

    if (esUnoSobreUnoMenosX) {
        agregarPuntoProblematico(
            puntos,
            1,
            '1',
            `1-x=0\\Rightarrow x=1`
        );
    }

    /*
        Familia: 1/(x^2-a^2)
        Problemas en x = -a y x = a
    */

    const diferenciaCuadrados = limpio.match(
        /^\\frac\{1\}\{x\^2-(\d+(?:\.\d+)?)\}$/
    );

    if (diferenciaCuadrados) {
        const a2 = Number(diferenciaCuadrados[1]);
        const a = Math.sqrt(a2);

        agregarPuntoProblematico(
            puntos,
            -a,
            mostrarNumero(-a),
            `x^2-${a2}=0\\Rightarrow x=${mostrarNumero(-a)}`
        );

        agregarPuntoProblematico(
            puntos,
            a,
            mostrarNumero(a),
            `x^2-${a2}=0\\Rightarrow x=${mostrarNumero(a)}`
        );
    }

    /*
        Familia: 1/[x sqrt(x^2-a^2)]
        Puntos delicados: x = 0, x = -a, x = a
    */

    const trigonometricaRaiz = limpio.match(
        /^\\frac\{1\}\{xsqrt\(x\^2-(\d+(?:\.\d+)?)\)\}$/
    );

    if (trigonometricaRaiz) {
        const a2 = Number(trigonometricaRaiz[1]);
        const a = Math.sqrt(a2);

        agregarPuntoProblematico(
            puntos,
            0,
            '0',
            `x=0\\quad\\text{anula el factor }x`
        );

        agregarPuntoProblematico(
            puntos,
            -a,
            mostrarNumero(-a),
            `x^2-${a2}=0\\Rightarrow x=${mostrarNumero(-a)}`
        );

        agregarPuntoProblematico(
            puntos,
            a,
            mostrarNumero(a),
            `x^2-${a2}=0\\Rightarrow x=${mostrarNumero(a)}`
        );
    }

    return puntos;
}

function obtenerProblemasEnExtremos(f, a, b) {
    const limpio = normalizar(f);
    const extremos = {
        izquierdo: false,
        derecho: false,
        textoIzquierdo: '',
        textoDerecho: ''
    };

    /*
        Para 1/[x(ln x)^p], x = 0 es extremo problemático
        por dominio si aparece como límite inferior.
    */

    const esLogaritmica =
        limpio.match(/^\\frac\{1\}\{x\(\\ln\(x\)\)\^(\d+(?:\.\d+)?)\}$/) ||
        limpio.match(/^\\frac\{1\}\{x\\ln\^(\d+(?:\.\d+)?)\(x\)\}$/) ||
        limpio.match(/^\\frac\{1\}\{x\(ln\(x\)\)\^(\d+(?:\.\d+)?)\}$/);

    if (esLogaritmica && a === 0) {
        extremos.izquierdo = true;
        extremos.textoIzquierdo = 'x=0';
    }

    /*
        Para 1/x^p, x = 0 puede estar en un extremo.
    */

    if (typeof leerPotenciaSimple === 'function') {
        const p = leerPotenciaSimple(f);

        if (p !== null) {
            if (a === 0) {
                extremos.izquierdo = true;
                extremos.textoIzquierdo = 'x=0';
            }

            if (b === 0) {
                extremos.derecho = true;
                extremos.textoDerecho = 'x=0';
            }
        }
    }

    return extremos;
}

function estaDentroDelIntervalo(valor, a, b) {
    const izquierda = a === -Infinity || a < valor;
    const derecha = b === Infinity || valor < b;

    return izquierda && derecha;
}

function construirParticionConPuntos(f, inferior, superior, puntosInternos, extremos) {
    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const puntos = puntosInternos
        .slice()
        .sort((p1, p2) => p1.valor - p2.valor);

    const partes = [];

    /*
        Caso con un solo punto interno:
        a ---- c ---- b
    */

    if (puntos.length === 1) {
        const c = puntos[0];
        const cLatex = c.latex;

        const limiteInferiorPrimeraParte = extremos.izquierdo
            ? `t`
            : `${mostrarNumero(a)}`;

        const prefijoIzquierdo = extremos.izquierdo
            ? `\\lim_{t\\to ${mostrarNumero(a)}^{+}}`
            : '';

        partes.push(
            `${prefijoIzquierdo}
            \\lim_{r\\to ${cLatex}^{-}}
            \\int_{${limiteInferiorPrimeraParte}}^{r}
            ${f}\\,dx`
        );

        const limiteSuperiorSegundaParte = extremos.derecho
            ? `u`
            : `${mostrarNumero(b)}`;

        const prefijoDerecho = extremos.derecho
            ? `\\lim_{u\\to ${mostrarNumero(b)}^{-}}`
            : '';

        partes.push(
            `\\lim_{s\\to ${cLatex}^{+}}
            ${prefijoDerecho}
            \\int_{s}^{${limiteSuperiorSegundaParte}}
            ${f}\\,dx`
        );

        return partes.join('+');
    }

    /*
        Caso con varios puntos internos:
        a ---- c1 ---- c2 ---- ... ---- b
    */

    for (let i = 0; i < puntos.length; i++) {
        const actual = puntos[i];
        const siguiente = puntos[i + 1];

        if (i === 0) {
            const limiteInferiorPrimeraParte = extremos.izquierdo
                ? `t`
                : `${mostrarNumero(a)}`;

            const prefijoIzquierdo = extremos.izquierdo
                ? `\\lim_{t\\to ${mostrarNumero(a)}^{+}}`
                : '';

            partes.push(
                `${prefijoIzquierdo}
                \\lim_{r_${i + 1}\\to ${actual.latex}^{-}}
                \\int_{${limiteInferiorPrimeraParte}}^{r_${i + 1}}
                ${f}\\,dx`
            );
        }

        if (siguiente) {
            partes.push(
                `\\lim_{s_${i + 1}\\to ${actual.latex}^{+}}
                \\lim_{r_${i + 2}\\to ${siguiente.latex}^{-}}
                \\int_{s_${i + 1}}^{r_${i + 2}}
                ${f}\\,dx`
            );
        }

        if (i === puntos.length - 1) {
            const limiteSuperiorUltimaParte = extremos.derecho
                ? `u`
                : `${mostrarNumero(b)}`;

            const prefijoDerecho = extremos.derecho
                ? `\\lim_{u\\to ${mostrarNumero(b)}^{-}}`
                : '';

            partes.push(
                `\\lim_{s_${i + 1}\\to ${actual.latex}^{+}}
                ${prefijoDerecho}
                \\int_{s_${i + 1}}^{${limiteSuperiorUltimaParte}}
                ${f}\\,dx`
            );
        }
    }

    return partes.join('+');
}

function detectarDiscontinuidadesInternasGenerales(f, inferior, superior) {
    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    if (a === null || b === null) {
        return null;
    }

    const puntosProblematicos = obtenerPuntosProblematicos(f);

    const internos = puntosProblematicos.filter(punto =>
        estaDentroDelIntervalo(punto.valor, a, b) &&
        !puntoEsExtremoIzquierdo(punto.valor, a) &&
        !puntoEsExtremoDerecho(punto.valor, b)
    );

    if (internos.length === 0) {
        return null;
    }

    const extremos = obtenerProblemasEnExtremos(f, a, b);

    const puntosLatex = internos
        .map(p => `x=${p.latex}`)
        .join(',\\quad ');

    const motivosLatex = internos
        .map(p => p.motivo)
        .join('\\\\');

    const particion = construirParticionConPuntos(
        f,
        inferior,
        superior,
        internos,
        extremos
    );

    return {
        caso: internos.length === 1
            ? `Caso 2: discontinuidad interna en ${puntosLatex}`
            : `Caso 2: varias discontinuidades internas`,

        metodo: 'Análisis previo de discontinuidades',
        resultado: 'Diverge',

        pasos: [
            {
                titulo: 'Buscar puntos problemáticos',
                texto: 'Antes de aplicar un método de integración, se revisa si la función deja de existir dentro del intervalo.',
                latex:
                    `${motivosLatex}`
            },

            {
                titulo: 'Comprobar su posición',
                texto: 'Como al menos un punto problemático está dentro del intervalo, la integral debe partirse.',
                latex:
                    `${puntosLatex}
                    \\in
                    (${mostrarNumero(a)},${mostrarNumero(b)})`
            },

            {
                titulo: 'Partir la integral',
                texto: 'Se separa la integral en los intervalos determinados por los puntos problemáticos.',
                latex:
                    `I=
                    ${particion}`
            },

            {
                titulo: 'Conclusión',
                texto: 'En estas familias reconocidas, la discontinuidad interna provoca que al menos una parte no tenga valor finito.',
                latex:
                    `\\boxed{\\text{La integral diverge}}`
            }
        ]
    };
}

/* =========================================================
   ANALIZADOR PRINCIPAL
   ========================================================= */

function resolverIntegral(f, inferior, superior) {
    const detectores = [
        detectarDiscontinuidadesInternasGenerales,
        detectarPotenciaLineal,
        detectarDiscontinuidadBasica,
        detectarPotenciaSimple,
        detectarCuadratica,
        detectarLogaritmica,
        detectarExponencialLogaritmica,
        detectarSechExponencial,
        detectarExponencialArctan,
        detectarArctanRacional,
        detectarDiferenciaCuadrados,
        detectarExponencialNegativa,
        detectarRaizSimple,
        detectarTrigonometricaRaiz
    ];

    for (const detector of detectores) {
        const solucion = detector(f, inferior, superior);

        if (solucion) return solucion;
    }

    return null;
}
function analizarIntegral() {
    const f = latexCampo(integrando);
    const inferior = latexCampo(limiteInferior);
    const superior = latexCampo(limiteSuperior);

    if (!f || !inferior || !superior) {
        alert('Completa la función y los dos límites de integración.');
        return;
    }

    const solucion = resolverIntegral(f, inferior, superior);

    if (!solucion) {
        mostrarNoSoportada(f, inferior, superior);
        return;
    }

    mostrarSolucion(solucion);
}

analizar.addEventListener('click', analizarIntegral);

/* =========================================================
   EJEMPLOS PRECARGADOS
   ========================================================= */

const ejemplos = {
    potencia: {
        inferior: '1',
        superior: '\\infty',
        integrando: '\\frac{1}{x^2}'
    },

    logaritmo: {
        inferior: '4',
        superior: '\\infty',
        integrando: '\\frac{1}{x(\\ln(x))^3}'
    },

    exponencial: {
        inferior: '0',
        superior: '\\infty',
        integrando: '\\frac{e^x}{e^x+1}'
    },

    arctan: {
        inferior: '-\\infty',
        superior: '\\infty',
        integrando: '\\frac{e^x}{e^{2x}+1}'
    },

    discontinua: {
        inferior: '0',
        superior: '2',
        integrando: '\\frac{1}{1-x}'
    },

    sustitucion: {
        inferior: '-2',
        superior: '1',
        integrando: '\\frac{1}{(x+1)^3}'
    }
};

document.querySelectorAll('[data-ejemplo]').forEach(boton => {
    boton.addEventListener('click', () => {
        const ejemplo = ejemplos[boton.dataset.ejemplo];

        if (!ejemplo) return;

        limiteInferior.value = ejemplo.inferior;
        limiteSuperior.value = ejemplo.superior;
        integrando.value = ejemplo.integrando;

        campoActivo = integrando;

        actualizarVistaIntegral();
        analizarIntegral();
    });
});

/* =========================================================
   INICIO
   ========================================================= */

window.addEventListener('DOMContentLoaded', async () => {
    await customElements.whenDefined('math-field');

    prepararCampos();
    actualizarVistaIntegral();
    analizarIntegral();
});