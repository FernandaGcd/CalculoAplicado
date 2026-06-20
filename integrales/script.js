let chart;

function calcular(){

let f = document.getElementById("funcion").value.trim()
let a = parseFloat(document.getElementById("a").value)
let b = parseFloat(document.getElementById("b").value)
let n = parseInt(document.getElementById("n").value)

if (!f || isNaN(a) || isNaN(b) || isNaN(n)){
alert("Ingresa los datos correctamente, por favor :)")
return
}

try{

let expr = math.compile(f)

let dx = (b-a)/n
let area = 0

// SUMA DE RIEMANN
for(let i=0;i<n;i++){

let x = a + i*dx
let y = expr.evaluate({x:x})

area += y*dx

}

// GENERAR PASOS
let pasosAprox = generarPasosRiemann(f,a,b,n)
let pasosExacta = generarPasosIntegral(f,a,b)

document.getElementById("pasosAprox").innerHTML = pasosAprox
document.getElementById("pasosExacta").innerHTML = pasosExacta

// RESULTADO APROXIMADO
document.getElementById("area").innerHTML =
"\\[A \\approx "+area.toFixed(5)+"\\]"


// AREA EXACTA

let matchPot = f.match(/x\^(\d+)/)
let matchLineal = f.match(/(\d*)x(?!\^)/)
let matchConst = f.match(/(^|\+)(\d+)(?!x)/)

let exacta = 0

// x^n
if(matchPot){

let k = parseInt(matchPot[1])
exacta += (Math.pow(b,k+1)/(k+1)) - (Math.pow(a,k+1)/(k+1))

}

// ax
if(matchLineal){

let c = matchLineal[1] === "" ? 1 : parseInt(matchLineal[1])
exacta += (c/2)*(b*b - a*a)

}

// constante
if(matchConst){

let c = parseInt(matchConst[2])
exacta += c*(b-a)

}
// mostrar resultado
if(matchPot || matchConst){

document.getElementById("areaExacta").innerHTML =
"\\[A = "+exacta.toFixed(5)+"\\]"

}else{

document.getElementById("areaExacta").innerHTML =
"\\[Área\\ exacta\\ disponible\\ solo\\ para\\ x^n\\ o\\ x^n+c\\]"

}

document.getElementById("areaExacta").innerHTML =
"\\[A = "+exacta.toFixed(5)+"\\]"

MathJax.typesetPromise()

graficar(expr,a,b)

}catch(error){

alert("Error detectado en la función " + error.message)

}

}


// PASOS SUMA DE RIEMANN

function generarPasosRiemann(funcion,a,b,n){

let pasos=""

pasos += `\\[A \\approx \\sum_{i=1}^{${n}} f(x_i)\\Delta x\\]`

pasos += `\\[f(x)=${funcion}\\]`

pasos += `\\[\\Delta x = \\frac{${b}-${a}}{${n}}\\]`

pasos += `\\[x_i = ${a} + i\\Delta x\\]`

pasos += `\\[A \\approx \\sum f(x_i)\\Delta x\\]`

return pasos

}


// PASOS INTEGRAL EXACTA

function generarPasosIntegral(funcion,a,b){

let pasos=""

let matchPot = funcion.match(/x\^(\d+)/)
let matchLineal = funcion.match(/(\d*)x(?!\^)/)
let matchConst = funcion.match(/(^|\+)(\d+)(?!x)/)

pasos += `\\[A = \\int_{${a}}^{${b}} ${funcion} dx\\]`

// POTENCIA x^n
if(matchPot){

let k=parseInt(matchPot[1])

pasos += `\\[\\int x^{${k}} dx = \\frac{x^{${k+1}}}{${k+1}}\\]`

}

// TERMINO LINEAL ax
if(matchLineal){

let c = matchLineal[1] === "" ? 1 : parseInt(matchLineal[1])

pasos += `\\[\\int ${c}x\\,dx = \\frac{${c}}{2}x^2\\]`

}

// CONSTANTE
if(matchConst){

let c=parseInt(matchConst[2])

pasos += `\\[\\int ${c} dx = ${c}x\\]`

}

// FUNCION PRIMITIVA
let partes=[]

if(matchPot){

let k=parseInt(matchPot[1])
partes.push(`\\frac{x^{${k+1}}}{${k+1}}`)

}

if(matchLineal){

let c = matchLineal[1] === "" ? 1 : parseInt(matchLineal[1])
partes.push(`\\frac{${c}}{2}x^2`)

}

if(matchConst){

let c=parseInt(matchConst[2])
partes.push(`${c}x`)

}

if(partes.length>0){

pasos += `\\[F(x)=${partes.join("+")}\\]`

}

pasos += `\\[A = F(${b})-F(${a})\\]`

return pasos

}


// GRAFICAR

function graficar(expr,a,b){

let puntosX=[]
let puntosY=[]
let areaPositiva=[]
let areaNegativa=[]

let step=(b-a)/300

for(let x=a;x<=b;x+=step){

let y = expr.evaluate({x:x})

puntosX.push(Number(x.toFixed(2)))
puntosY.push(y)

if(y>=0){

areaPositiva.push(y)
areaNegativa.push(null)

}else{

areaPositiva.push(null)
areaNegativa.push(y)

}

}

if(chart){
chart.destroy()
}

chart = new Chart(document.getElementById("grafica"),{

type:'line',

data:{
labels:puntosX,

datasets:[

{
label:'f(x)',
data:puntosY,
borderColor:'#f6edff',
borderWidth:3,
pointRadius:0,
tension:0.3
},

{
label:'Área positiva',
data:areaPositiva,
fill:'origin',
backgroundColor:'rgba(203,129,255,0.35)',
borderWidth:0,
pointRadius:0
},

{
label:'Área negativa',
data:areaNegativa,
fill:'origin',
backgroundColor:'rgba(255,108,243,0.35)',
borderWidth:0,
pointRadius:0
}

]

},

options:{

responsive:true,

plugins:{
legend:{
position:'top',
labels:{
color:'white'
}
}
},

scales:{

x:{
grid:{color:'#8d7ba4'},
ticks:{color:'white'},
title:{display:true,text:'x',color:'white'}
},

y:{
grid:{color:'#8d7ba4'},
ticks:{color:'white'},
title:{display:true,text:'f(x)',color:'white'}
}

}

}

})

}