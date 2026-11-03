import materiales from '../data/materiales.json'

const ID_MORA = 202
const ID_INGENIO_DEL_HEROE = 104003
const EXP_POR_INGENIO = 20000
const MORA_POR_EXP = 1 / 5 // subir de nivel cuesta 1 de mora por cada 5 de EXP

// Experiencia acumulada desde el nivel 1 (no viene en genshin-db)
const EXP_ACUMULADA = { 1: 0, 20: 120175, 40: 698500, 50: 1277600, 60: 2131725, 70: 3327650, 80: 4939525, 90: 8362650 }

// Cada opción es un nivel con su fase de ascensión, como el juego muestra "Nv. 20/40"
export const NIVELES = [
  { etiqueta: '1/20', nivel: 1, fase: 0 },
  { etiqueta: '20/20', nivel: 20, fase: 0 },
  { etiqueta: '20/40', nivel: 20, fase: 1 },
  { etiqueta: '40/40', nivel: 40, fase: 1 },
  { etiqueta: '40/50', nivel: 40, fase: 2 },
  { etiqueta: '50/50', nivel: 50, fase: 2 },
  { etiqueta: '50/60', nivel: 50, fase: 3 },
  { etiqueta: '60/60', nivel: 60, fase: 3 },
  { etiqueta: '60/70', nivel: 60, fase: 4 },
  { etiqueta: '70/70', nivel: 70, fase: 4 },
  { etiqueta: '70/80', nivel: 70, fase: 5 },
  { etiqueta: '80/80', nivel: 80, fase: 5 },
  { etiqueta: '80/90', nivel: 80, fase: 6 },
  { etiqueta: '90/90', nivel: 90, fase: 6 },
]

export const NOMBRES_TALENTOS = ['Ataque normal', 'Habilidad elemental', 'Habilidad definitiva']

export const nuevoPlan = (slug) => ({
  slug,
  nivelActual: 0,
  nivelObjetivo: NIVELES.length - 1,
  talentos: [
    [1, 10],
    [1, 10],
    [1, 10],
  ],
})

function sumarFases(total, fases) {
  for (const fase of fases) {
    for (const [id, cantidad] of fase) total.set(id, (total.get(id) ?? 0) + cantidad)
  }
}

// Devuelve un Map id → cantidad con todo lo que necesita un personaje según su plan
export function calcularPlan(personaje, plan) {
  const total = new Map()
  const actual = NIVELES[plan.nivelActual]
  const objetivo = NIVELES[plan.nivelObjetivo]

  if (objetivo.fase > actual.fase) {
    sumarFases(total, personaje.costesAscension.slice(actual.fase, objetivo.fase))
  }

  const exp = EXP_ACUMULADA[objetivo.nivel] - EXP_ACUMULADA[actual.nivel]
  if (exp > 0) {
    total.set(ID_INGENIO_DEL_HEROE, Math.ceil(exp / EXP_POR_INGENIO))
    total.set(ID_MORA, (total.get(ID_MORA) ?? 0) + Math.round(exp * MORA_POR_EXP))
  }

  for (const [desde, hasta] of plan.talentos) {
    // costesTalento[0] es el paso del nivel 1 al 2
    if (hasta > desde) sumarFases(total, personaje.costesTalento.slice(desde - 1, hasta - 1))
  }

  return total
}

export function sumarTotales(mapas) {
  const total = new Map()
  for (const mapa of mapas) {
    for (const [id, cantidad] of mapa) total.set(id, (total.get(id) ?? 0) + cantidad)
  }
  return total
}

// El inventario es uno solo: se reparte en orden y cada personaje toma lo que
// necesita de lo que dejaron los anteriores. Devuelve, por personaje, un Map id → cantidad cubierta.
export function repartirInventario(necesidades, inventario) {
  const disponible = { ...inventario }
  return necesidades.map((necesita) => {
    const cubiertos = new Map()
    for (const [id, cantidad] of necesita) {
      const cubierto = Math.min(cantidad, disponible[id] ?? 0)
      cubiertos.set(id, cubierto)
      disponible[id] = (disponible[id] ?? 0) - cubierto
    }
    return cubiertos
  })
}

const GRUPOS = [
  { titulo: 'Mora y experiencia', incluye: (m) => m.tipo === 'Moneda común' || m.tipo === 'Material EXP de Personaje' },
  { titulo: 'Gemas de ascensión', incluye: (m) => m.tipo === 'Material de ascensión de personaje' },
  { titulo: 'Materiales de jefes', incluye: (m) => m.tipo === 'Material de mejora de personaje' },
  { titulo: 'Especialidades locales', incluye: (m) => m.tipo.startsWith('Objeto típico') },
  { titulo: 'Libros de talento', incluye: (m) => m.tipo === 'Material de talento de personaje' },
  { titulo: 'Materiales comunes', incluye: () => true },
]

// Convierte el Map de totales en grupos ordenados para mostrarlos en pantalla
export function agruparMateriales(totales) {
  const grupos = GRUPOS.map((g) => ({ titulo: g.titulo, items: [] }))
  for (const [id, cantidad] of totales) {
    const material = { id, cantidad, ...materiales[id] }
    const indice = GRUPOS.findIndex((g) => g.incluye(material))
    grupos[indice].items.push(material)
  }
  for (const g of grupos) g.items.sort((a, b) => a.orden - b.orden || a.rareza - b.rareza)
  return grupos.filter((g) => g.items.length)
}
