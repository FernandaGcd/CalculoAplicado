let chart;
let campoActivo = null;

window.addEventListener("DOMContentLoaded", async () => {
    await customElements.whenDefined("math-field");

    const campo = document.getElementById("funcion");
    campoActivo = campo;

    campo.addEventListener("focusin", () => {
        campoActivo = campo;
    });

    document.querySelectorAll("[data-insert]").forEach(boton => {
        boton.addEventListener("click", () => {
            campoActivo.focus();

            campoActivo.executeCommand([
                "insert",
                boton.dataset.insert
            ]);
        });
    });

    document.getElementById("borrarCampo").addEventListener("click", () => {
        campoActivo.value = "";
        campoActivo.focus();
    });
});

/* =========================================================
   CONVERSIÓN DE LATEX A EXPRESIÓN PARA MATH.JS
   ========================================================= */

function obtenerEntrada() {
    const campo = document.getElementById("funcion");

    if (campo.tagName.toLowerCase() === "math-field") {
        return campo.value.trim();
    }

    return campo.value.trim();
}

function normalizarLatex(latex) {
    return latex
        .replaceAll("\\left", "")
        .replaceAll("\\right", "")
        .replaceAll("\\,", "")
        .replaceAll("\\!", "")
        .replaceAll(" ", "")
        .replaceAll("−", "-")
        .replaceAll("\\cdot", "*")
        .replaceAll("\\operatorname{ln}", "\\ln")
        .replaceAll("\\mathrm{e}", "e")
        .replace(/\^\{([^{}]+)\}/g, "^($1)")
        .replace(/n\^\((\d+)\)/g, "n^$1");
}

function latexAMathJS(latex) {
    let expr = normalizarLatex(latex);

    expr = convertirFracciones(expr);

    expr = expr
        .replaceAll("\\ln", "log")
        .replaceAll("\\sqrt", "sqrt")
        .replaceAll("\\pi", "pi")
        .replaceAll("\\infty", "Infinity")
        .replaceAll("{", "(")
        .replaceAll("}", ")");

    expr = expr.replace(/([0-9])n/g, "$1*n");
    expr = expr.replace(/\)(n)/g, ")*n");

    return expr;
}

function convertirFracciones(expr) {
    while (expr.includes("\\frac")) {
        const inicio = expr.indexOf("\\frac");
        const numInicio = expr.indexOf("{", inicio);

        if (numInicio === -1) break;

        const numFin = encontrarCierre(expr, numInicio);
        const denInicio = expr.indexOf("{", numFin + 1);

        if (denInicio === -1) break;

        const denFin = encontrarCierre(expr, denInicio);

        const numerador = expr.slice(numInicio + 1, numFin);
        const denominador = expr.slice(denInicio + 1, denFin);

        const reemplazo = `((${convertirFracciones(numerador)}))/((${convertirFracciones(denominador)}))`;

        expr =
            expr.slice(0, inicio) +
            reemplazo +
            expr.slice(denFin + 1);
    }

    return expr;
}

function encontrarCierre(texto, apertura) {
    let nivel = 0;

    for (let i = apertura; i < texto.length; i++) {
        if (texto[i] === "{") nivel++;
        if (texto[i] === "}") nivel--;

        if (nivel === 0) return i;
    }

    return -1;
}

/* =========================================================
   CÁLCULO PRINCIPAL
   ========================================================= */

function calcular() {
    let entradaLatex = obtenerEntrada();

    if (!entradaLatex) {
        alert("Por favor, ingresa un término general.");
        return;
    }

    try {
        const analisis = analizarSerie(entradaLatex);
        const exprMath = latexAMathJS(entradaLatex);
        const expr = math.compile(exprMath);

        let sumaParcial = 0;
        let historial = [];
        let nValores = [];

        for (let n = 1; n <= 1000; n++) {
            let valorTermino = expr.evaluate({ n: n });

            if (!Number.isFinite(valorTermino)) {
                historial.push(null);
                nValores.push(n);
                continue;
            }

            sumaParcial += valorTermino;
            nValores.push(n);
            historial.push(sumaParcial);
        }

        document.getElementById("pasos").innerHTML = generarPasos(entradaLatex, analisis);

        if (analisis.converge === true) {
            if (analisis.sumaExacta) {
                document.getElementById("area").innerHTML =
                    `\\[ S = ${analisis.sumaExacta} \\]`;
            } else {
                document.getElementById("area").innerHTML =
                    `\\[ S_{1000} \\approx ${sumaParcial.toFixed(5)} \\]`;
            }
        } else if (analisis.converge === false) {
            document.getElementById("area").innerHTML =
                `\\[ \\text{La serie diverge, por lo tanto no se calcula una suma.} \\]`;
        } else {
            document.getElementById("area").innerHTML =
                `\\[ \\text{No se puede asegurar convergencia con este criterio. No se calcula suma.} \\]`;
        }

        MathJax.typesetPromise();

        graficarSerie(nValores, historial, analisis.converge);

    } catch (error) {
        alert("Error en el cálculo: " + error.message);
    }
}

/* =========================================================
   RECONOCIMIENTO DE SERIES
   ========================================================= */

function analizarSerie(entradaLatex) {
    const limpio = normalizarLatex(entradaLatex);
    const mathExpr = latexAMathJS(entradaLatex);

    const geo = detectarGeometrica(limpio);
    if (geo) return geo;

    const pSerie = detectarPSerie(limpio);
    if (pSerie) return pSerie;

    const telescopica = detectarTelescopica(limpio);
    if (telescopica) return telescopica;

    const enesimo = detectarEnesimoTermino(mathExpr);
    return enesimo;
}

function detectarGeometrica(limpio) {
    /*
        Reconoce:
        (1/2)^n
        (1/3)^n
        2*(1/3)^n
        3(1/4)^n
        2^n
        0.5^n
    */

    let expr = limpio;

    expr = expr.replace(/\(\(([-\d.]+)\)\)\/\(\(([-\d.]+)\)\)/g, "($1/$2)");

    let match = expr.match(/^([+-]?\d+(?:\.\d+)?)?\*?\(?([+-]?\d+(?:\.\d+)?)\)?\^n$/);

    if (match) {
        const a = match[1] ? Number(match[1]) : 1;
        const r = Number(match[2]);

        return construirGeometrica(a, r);
    }

    match = expr.match(/^([+-]?\d+(?:\.\d+)?)?\*?\(?\\frac\{([+-]?\d+(?:\.\d+)?)\}\{([+-]?\d+(?:\.\d+)?)\}\)?\^n$/);

    if (match) {
        const a = match[1] ? Number(match[1]) : 1;
        const r = Number(match[2]) / Number(match[3]);

        return construirGeometrica(a, r);
    }

    match = expr.match(/^([+-]?\d+(?:\.\d+)?)?\*?\(?\(\(([-\d.]+)\)\)\/\(\(([-\d.]+)\)\)\)?\^n$/);

    if (match) {
        const a = match[1] ? Number(match[1]) : 1;
        const r = Number(match[2]) / Number(match[3]);

        return construirGeometrica(a, r);
    }

    return null;
}

function construirGeometrica(a, r) {
    if (Math.abs(r) < 1) {
        const suma = a * r / (1 - r);
        const sumaLatex = convertirAFraccion(suma);

        return {
            tipo: "Serie geométrica",
            converge: true,
            sumaExacta: sumaLatex,
            pasosExtra: [
                `\\[ \\text{Serie geométrica: } a_n=${a}(${r})^n \\]`,
                `\\[ r=${r} \\]`,
                `\\[ |r|<1 \\Rightarrow \\text{converge} \\]`,
                `\\[ S=\\frac{a r}{1-r}= ${sumaLatex} \\]`
            ]
        };
    }

    return {
        tipo: "Serie geométrica",
        converge: false,
        pasosExtra: [
            `\\[ \\text{Serie geométrica: } r=${r} \\]`,
            `\\[ |r|\\geq1 \\Rightarrow \\text{diverge} \\]`
        ]
    };
}

function detectarPSerie(limpio) {
    /*
        Reconoce:
        1/n
        1/n^2
        1/n^3
        n^-2
    */

    let match = limpio.match(/^\\frac\{1\}\{n\^?(\d+(?:\.\d+)?)?\}$/);

    if (match) {
        const p = match[1] ? Number(match[1]) : 1;
        return construirPSerie(p);
    }

    match = limpio.match(/^n\^-\(?(\d+(?:\.\d+)?)\)?$/);

    if (match) {
        const p = Number(match[1]);
        return construirPSerie(p);
    }

    return null;
}

function construirPSerie(p) {
    if (p > 1) {
        return {
            tipo: "Serie p",
            converge: true,
            sumaExacta: null,
            pasosExtra: [
                `\\[ \\text{Serie }p\\text{ o hiperarmónica: } \\sum \\frac{1}{n^p} \\]`,
                `\\[ p=${p} \\]`,
                `\\[ p>1 \\Rightarrow \\text{converge} \\]`,
                `\\[ \\text{No se calcula suma exacta con este criterio.} \\]`
            ]
        };
    }

    return {
        tipo: "Serie p",
        converge: false,
        pasosExtra: [
            `\\[ \\text{Serie }p\\text{ o hiperarmónica: } \\sum \\frac{1}{n^p} \\]`,
            `\\[ p=${p} \\]`,
            `\\[ p\\leq1 \\Rightarrow \\text{diverge} \\]`
        ]
    };
}

function detectarTelescopica(limpio) {
    /*
        Reconoce:
        1/(n(n+1))
        1/(n*(n+1))
    */

    const formas = [
        "\\frac{1}{n(n+1)}",
        "\\frac{1}{n*(n+1)}",
        "\\frac{1}{(n)(n+1)}",
        "\\frac{1}{n\\left(n+1\\right)}"
    ];

    if (
        formas.includes(limpio) ||
        limpio === "((1))/((n(n+1)))" ||
        limpio === "1/(n*(n+1))"
    ) {
        return {
            tipo: "Serie telescópica",
            converge: true,
            sumaExacta: "1",
            pasosExtra: [
                `\\[ \\text{Serie telescópica detectada} \\]`,
                `\\[ \\frac{1}{n(n+1)}=\\frac{1}{n}-\\frac{1}{n+1} \\]`,
                `\\[ S_N=1-\\frac{1}{N+1} \\]`,
                `\\[ \\lim_{N\\to\\infty}S_N=1 \\]`,
                `\\[ \\text{Converge a }1 \\]`
            ]
        };
    }

    return null;
}

function detectarEnesimoTermino(mathExpr) {
    let limiteAprox;

    try {
        const expr = math.compile(mathExpr);
        limiteAprox = expr.evaluate({ n: 1000000 });
    } catch (error) {
        return {
            tipo: "No reconocido",
            converge: null,
            pasosExtra: [
                `\\[ \\text{No se pudo reconocer automáticamente el tipo de serie.} \\]`,
                `\\[ \\text{Revisa si el término general está escrito en función de } n. \\]`
            ]
        };
    }

    if (!Number.isFinite(limiteAprox)) {
        return {
            tipo: "Criterio del enésimo término",
            converge: false,
            pasosExtra: [
                `\\[ \\text{Criterio del enésimo término} \\]`,
                `\\[ \\lim_{n\\to\\infty}a_n \\text{ no es finito} \\]`,
                `\\[ \\Rightarrow \\text{La serie diverge} \\]`
            ]
        };
    }

    if (Math.abs(limiteAprox) > 0.0001) {
        return {
            tipo: "Criterio del enésimo término",
            converge: false,
            pasosExtra: [
                `\\[ \\text{Criterio del enésimo término} \\]`,
                `\\[ \\lim_{n\\to\\infty}a_n \\neq 0 \\]`,
                `\\[ \\Rightarrow \\text{La serie diverge} \\]`
            ]
        };
    }

    return {
        tipo: "Criterio del enésimo término",
        converge: null,
        pasosExtra: [
            `\\[ \\text{Criterio del enésimo término} \\]`,
            `\\[ \\lim_{n\\to\\infty}a_n=0 \\]`,
            `\\[ \\text{Este criterio no concluye. Se requieren otros criterios.} \\]`
        ]
    };
}

/* =========================================================
   GENERAR PASOS
   ========================================================= */

function generarPasos(funcionLatex, analisis) {
    let pasos = "";

    pasos += `\\[ \\text{Serie ingresada: } \\sum_{n=1}^{\\infty} ${funcionLatex} \\]`;

    if (analisis && analisis.pasosExtra) {
        pasos += analisis.pasosExtra.join("");
    }

    return pasos;
}

/* =========================================================
   GRÁFICA
   ========================================================= */

function graficarSerie(nValores, historial, converge) {
    if (chart) {
        chart.destroy();
    }

    const etiqueta = converge === true
        ? "Suma acumulada Sₙ"
        : "Comportamiento de sumas parciales";

    chart = new Chart(document.getElementById("grafica"), {
        type: "line",
        data: {
            labels: nValores,
            datasets: [{
                label: etiqueta,
                data: historial,
                borderColor: "#00e5ff",
                backgroundColor: "rgba(0, 229, 255, 0.1)",
                fill: true,
                pointRadius: 1,
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "n (términos)",
                        color: "white"
                    },
                    ticks: {
                        color: "white",
                        maxTicksLimit: 10
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: converge === true ? "Valor de Sₙ" : "Sumas parciales",
                        color: "white"
                    },
                    ticks: {
                        color: "white"
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            }
        }
    });
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function convertirAFraccion(numero) {
    if (!Number.isFinite(numero)) return "\\infty";

    if (Math.abs(numero - Math.round(numero)) < 1e-10) {
        return `${Math.round(numero)}`;
    }

    for (let d = 2; d <= 500; d++) {
        const n = Math.round(numero * d);

        if (Math.abs(numero - n / d) < 1e-9) {
            const divisor = mcd(Math.abs(n), Math.abs(d));
            const num = n / divisor;
            const den = d / divisor;

            if (num < 0) {
                return `-\\frac{${Math.abs(num)}}{${den}}`;
            }

            return `\\frac{${num}}{${den}}`;
        }
    }

    return numero.toFixed(5);
}

function mcd(a, b) {
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }

    return a;
}