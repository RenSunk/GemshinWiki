// Simulador de gachapón y calculadora de probabilidades.
// Probabilidades base y pity máximo: las oficiales que publica el juego en cada gondolero.
// La subida a partir de cierta tirada ("pity suave") no es oficial: sus parámetros están elegidos para
// reproducir las probabilidades totales oficiales (con pity incluido):
//   personaje 5★ 1,6% (modelo 1,61%) · 4★ 13% (13,06%) — arma 5★ 1,85% (1,856%) · 4★ 14,5% (14,48%)
// No se simula la "Captura radiante" (desde la versión 5.0), cuyas probabilidades exactas no son públicas.

export const GONDOLEROS = {
  personaje: {
    nombre: 'Personaje destacado',
    base5: 0.006,
    inicioSuave5: 74,
    subida5: 0.06,
    maximo5: 90,
    base4: 0.051,
    inicioSuave4: 9,
    subida4: 0.51,
    maximo4: 10,
  },
  arma: {
    nombre: 'Arma destacada',
    base5: 0.007,
    inicioSuave5: 64,
    subida5: 0.07,
    maximo5: 80,
    base4: 0.06,
    inicioSuave4: 8,
    subida4: 0.4,
    maximo4: 10,
  },
}

export const PROTOGEMAS_POR_TIRADA = 160

// Probabilidad de que la tirada número `n` desde el último 5★ (o 4★) lo sea
function probabilidad(n, base, inicioSuave, subida, maximo) {
  if (n >= maximo) return 1
  if (n < inicioSuave) return base
  return Math.min(1, base + subida * (n - inicioSuave + 1))
}
export const probabilidad5 = (g, n) => probabilidad(n, g.base5, g.inicioSuave5, g.subida5, g.maximo5)
export const probabilidad4 = (g, n) => probabilidad(n, g.base4, g.inicioSuave4, g.subida4, g.maximo4)

// Promedio de tiradas hasta un 5★ (o 4★): sirve para comprobar el modelo contra la probabilidad total oficial
export function tiradasPromedio(g, estrellas = 5) {
  const p = estrellas === 5 ? (n) => probabilidad5(g, n) : (n) => probabilidad4(g, n)
  const maximo = estrellas === 5 ? g.maximo5 : g.maximo4
  let sinSalir = 1
  let promedio = 0
  for (let n = 1; n <= maximo; n++) {
    promedio += n * sinSalir * p(n)
    sinSalir *= 1 - p(n)
  }
  return promedio
}

// ---------- Simulación de una tirada ----------
// estado: { pity5, pity4, garantizado5, garantizado4, puntosDestino }
//   pity = tiradas desde el último 5★/4★; garantizado = el próximo es el destacado (se perdió el anterior);
//   puntosDestino = Camino de la Epitomización del gondolero de armas (0 o 1).
// Devuelve { estado, resultado } con resultado.estrellas (3, 4, 5) y resultado.tipo:
//   'destacado' | 'otro-destacado' (arma destacada que no elegiste) | 'estandar' | 'normal' (3★)
export function tirar(tipoGondolero, estado, aleatorio = Math.random) {
  const g = GONDOLEROS[tipoGondolero]
  const pity5 = estado.pity5 + 1
  const pity4 = estado.pity4 + 1

  if (aleatorio() < probabilidad5(g, pity5)) {
    const nuevo = { ...estado, pity5: 0, pity4: pity4 }
    let tipo
    if (tipoGondolero === 'personaje') {
      // 50/50: si se perdió el anterior, este es seguro el destacado
      tipo = estado.garantizado5 || aleatorio() < 0.5 ? 'destacado' : 'estandar'
      nuevo.garantizado5 = tipo === 'estandar'
    } else if (estado.puntosDestino >= 1) {
      // Camino de la Epitomización: con 1 punto, el siguiente 5★ es el arma elegida
      tipo = 'destacado'
    } else {
      // 75/25: si sale una destacada, es la elegida la mitad de las veces
      const deDestacadas = estado.garantizado5 || aleatorio() < 0.75
      tipo = deDestacadas ? (aleatorio() < 0.5 ? 'destacado' : 'otro-destacado') : 'estandar'
      nuevo.garantizado5 = tipo === 'estandar'
    }
    if (tipoGondolero === 'arma') nuevo.puntosDestino = tipo === 'destacado' ? 0 : 1
    if (tipoGondolero === 'arma' && tipo === 'destacado') nuevo.garantizado5 = false
    return { estado: nuevo, resultado: { estrellas: 5, tipo, pity: pity5 } }
  }

  if (aleatorio() < probabilidad4(g, pity4)) {
    const acierto = tipoGondolero === 'personaje' ? 0.5 : 0.75
    const tipo = estado.garantizado4 || aleatorio() < acierto ? 'destacado' : 'estandar'
    return {
      estado: { ...estado, pity5, pity4: 0, garantizado4: tipo === 'estandar' },
      resultado: { estrellas: 4, tipo, pity: pity4 },
    }
  }

  return { estado: { ...estado, pity5, pity4 }, resultado: { estrellas: 3, tipo: 'normal' } }
}

export const estadoInicial = () => ({ pity5: 0, pity4: 0, garantizado5: false, garantizado4: false, puntosDestino: 0 })

// ---------- Calculadora: probabilidad de conseguir N copias en X tiradas ----------
// Cálculo exacto (sin azar): se recorren todos los estados posibles de pity y 50/50 tirada a tirada.
// Para armas, "copias" del arma elegida, con el Camino de la Epitomización.

// Prepara el cálculo y devuelve una función que avanza una tirada y da la probabilidad de tener
// al menos 1, 2… `copias` copias ([i] = al menos i+1)
function calculoPorTiradas(tipoGondolero, { pity = 0, garantizado = false, puntosDestino = 0, copias }) {
  const g = GONDOLEROS[tipoGondolero]
  const esArma = tipoGondolero === 'arma'
  // Estado: [pity][garantía][copias conseguidas]; la última casilla de copias acumula "ya están todas".
  // Garantía en personajes: 0 = 50/50, 1 = destacado seguro. En armas: 0 = nada, 1 = destacada segura, 2 = punto de destino.
  const nPity = g.maximo5
  const nGarantia = esArma ? 3 : 2
  const crear = () => Array.from({ length: nPity }, () => Array.from({ length: nGarantia }, () => new Float64Array(copias + 1)))

  let dist = crear()
  const garantiaInicial = esArma ? (puntosDestino >= 1 ? 2 : garantizado ? 1 : 0) : garantizado ? 1 : 0
  dist[Math.min(pity, nPity - 1)][garantiaInicial][0] = 1

  return function avanzar() {
    const siguiente = crear()
    for (let p = 0; p < nPity; p++) {
      const p5 = probabilidad5(g, p + 1)
      for (let gar = 0; gar < nGarantia; gar++) {
        const fila = dist[p][gar]
        for (let c = 0; c <= copias; c++) {
          const masa = fila[c]
          if (!masa) continue
          // No sale 5★
          if (p + 1 < nPity) siguiente[p + 1][gar][c] += masa * (1 - p5)
          // Sale 5★
          const sale = masa * p5
          const mas = Math.min(c + 1, copias)
          if (!esArma) {
            if (gar === 1) siguiente[0][0][mas] += sale
            else {
              siguiente[0][0][mas] += sale * 0.5
              siguiente[0][1][c] += sale * 0.5
            }
          } else if (gar === 2) {
            siguiente[0][0][mas] += sale
          } else {
            // Elegida: 37,5% (o 50% si estaba garantizada una destacada); si no, punto de destino
            const elegida = gar === 1 ? 0.5 : 0.375
            siguiente[0][0][mas] += sale * elegida
            siguiente[0][2][c] += sale * (1 - elegida)
          }
        }
      }
    }
    dist = siguiente

    const alMenos = new Array(copias).fill(0)
    for (const porGarantia of dist) {
      for (const fila of porGarantia) {
        for (let c = 1; c <= copias; c++) for (let i = 0; i < c; i++) alMenos[i] += fila[c]
      }
    }
    return alMenos
  }
}

// Probabilidad de tener al menos 1, 2… `copias` copias tras `tiradas` ([i] = al menos i+1)
export function probabilidadCopias(tipoGondolero, { tiradas, ...opciones }) {
  const avanzar = calculoPorTiradas(tipoGondolero, opciones)
  let alMenos = new Array(opciones.copias).fill(0)
  for (let t = 0; t < tiradas; t++) alMenos = avanzar()
  return alMenos
}

// Tiradas necesarias para tener todas las copias con al menos cada probabilidad de `objetivos`
// (p. ej. [0.5, 0.9] → { 0.5: 140, 0.9: 230 }). El peor caso está acotado por el pity, así que termina.
export function tiradasNecesarias(tipoGondolero, opciones, objetivos = [0.5, 0.9]) {
  const avanzar = calculoPorTiradas(tipoGondolero, opciones)
  const resultado = {}
  const pendientes = [...objetivos].sort((a, b) => a - b)
  for (let t = 1; pendientes.length; t++) {
    const todas = avanzar()[opciones.copias - 1]
    while (pendientes.length && todas >= pendientes[0] - 1e-12) resultado[pendientes.shift()] = t
  }
  return resultado
}
