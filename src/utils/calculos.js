import materiales from '../data/materiales.json'

const ID_MORA = 202

// La experiencia se cuenta en puntos con un "material virtual" por tipo. En el inventario
// se escriben los libros/minerales que tienes y aquí se convierten a puntos.
export const EXP = {
  personaje: {
    id: 'exp-personaje',
    nombre: 'EXP de personaje',
    moraPorExp: 1 / 5, // subir de nivel a un personaje cuesta 1 de mora por cada 5 de EXP
    // [id del material, puntos de EXP que da], de mayor a menor
    fuentes: [
      [104003, 20000],
      [104002, 5000],
      [104001, 1000],
    ],
  },
  arma: {
    id: 'exp-arma',
    nombre: 'EXP de arma',
    moraPorExp: 1 / 10,
    fuentes: [
      [104013, 10000],
      [104012, 2000],
      [104011, 400],
    ],
  },
}
const EXP_POR_ID = Object.fromEntries(Object.values(EXP).map((e) => [e.id, e]))

// Experiencia acumulada desde el nivel 1. No viene en genshin-db; sale de los datos del juego
// (AvatarLevelExcelConfigData y WeaponLevelExcelConfigData, el de armas depende de la rareza).
const EXP_ACUMULADA_PERSONAJE = { 1: 0, 20: 120175, 40: 698500, 50: 1277600, 60: 2131725, 70: 3327650, 80: 4939525, 90: 8362650 }
const EXP_ACUMULADA_ARMA = {
  1: { 1: 0, 20: 24325, 40: 148875, 50: 274500, 60: 460025, 70: 719875 },
  2: { 1: 0, 20: 36400, 40: 223225, 50: 411650, 60: 689950, 70: 1079675 },
  3: { 1: 0, 20: 53475, 40: 327475, 50: 603825, 60: 1011975, 70: 1583600, 80: 2353725, 90: 3988200 },
  4: { 1: 0, 20: 81000, 40: 496125, 50: 914850, 60: 1533250, 70: 2399300, 80: 3566175, 90: 6042650 },
  5: { 1: 0, 20: 121550, 40: 744350, 50: 1372500, 60: 2300175, 70: 3599300, 80: 5349675, 90: 9064450 },
}

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

// Las armas de 1-2★ solo llegan al nivel 70 (4 ascensiones)
export const nivelesDisponibles = (entidad) => NIVELES.filter((n) => n.fase <= entidad.costesAscension.length)

// Opción de NIVELES que corresponde a un nivel y fase de ascensión reales del juego. Como el planificador
// solo tiene los niveles de corte (20, 40, 50…), se toma el más alto que no supera el real con esa fase:
// un personaje a nivel 63 con 4 ascensiones queda en "60/70".
export function nivelDesdeJuego(nivel, fase) {
  let indice = 0
  NIVELES.forEach((n, i) => {
    if (n.fase === fase && n.nivel <= nivel) indice = i
  })
  return indice
}

export const NOMBRES_TALENTOS =['Ataque normal', 'Habilidad elemental', 'Habilidad definitiva']

export const nuevoPlan = (tipo, entidad) => ({
  tipo,
  slug: entidad.slug,
  nivelActual: 0,
  nivelObjetivo: nivelesDisponibles(entidad).length - 1,
  ...(tipo === 'personaje' && {
    talentos: [
      [1, 10],
      [1, 10],
      [1, 10],
    ],
  }),
})

function sumarFases(total, fases) {
  for (const fase of fases) {
    for (const [id, cantidad] of fase) total.set(id, (total.get(id) ?? 0) + cantidad)
  }
}

// Devuelve un Map id → cantidad con todo lo que necesita un personaje o arma según su plan
export function calcularPlan(entidad, plan) {
  const tipo = plan.tipo ?? 'personaje'
  const total = new Map()
  const actual = NIVELES[plan.nivelActual]
  const objetivo = NIVELES[plan.nivelObjetivo]

  if (objetivo.fase > actual.fase) {
    sumarFases(total, entidad.costesAscension.slice(actual.fase, objetivo.fase))
  }

  const tabla = tipo === 'arma' ? EXP_ACUMULADA_ARMA[entidad.rareza] : EXP_ACUMULADA_PERSONAJE
  const exp = tabla[objetivo.nivel] - tabla[actual.nivel]
  if (exp > 0) {
    total.set(EXP[tipo].id, exp)
    total.set(ID_MORA, (total.get(ID_MORA) ?? 0) + Math.round(exp * EXP[tipo].moraPorExp))
  }

  for (const [desde, hasta] of plan.talentos ?? []) {
    // costesTalento[0] es el paso del nivel 1 al 2
    if (hasta > desde) sumarFases(total, entidad.costesTalento.slice(desde - 1, hasta - 1))
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

// Puntos de EXP que suman los libros o minerales de tu inventario
export const expEnInventario = (tipoExp, inventario) =>
  tipoExp.fuentes.reduce((suma, [id, puntos]) => suma + (inventario[id] ?? 0) * puntos, 0)

// Cuántas unidades de `id` se pueden fabricar con lo disponible (bajando por toda la cadena)
function maxFabricable(id, disponible) {
  const receta = materiales[id]?.receta
  if (!receta) return 0
  const deNivelInferior = (disponible[receta.de] ?? 0) + maxFabricable(receta.de, disponible)
  return Math.floor(deNivelInferior / receta.cantidad)
}

// Fabrica `cantidad` de `id` gastando primero lo del nivel inferior y, si no alcanza, fabricándolo.
// Devuelve la mora que cuesta.
function fabricar(id, cantidad, disponible) {
  const receta = materiales[id].receta
  const necesario = cantidad * receta.cantidad
  const directo = Math.min(disponible[receta.de] ?? 0, necesario)
  disponible[receta.de] = (disponible[receta.de] ?? 0) - directo
  let mora = cantidad * receta.mora
  if (necesario > directo) mora += fabricar(receta.de, necesario - directo, disponible)
  return mora
}

const profundidad = (id) => (materiales[id]?.receta ? 1 + profundidad(materiales[id].receta.de) : 0)

// El inventario es uno solo: se reparte en orden y cada personaje o arma toma lo que necesita
// de lo que dejaron los anteriores. Con `alquimia`, lo que falta se fabrica con materiales de
// nivel inferior que sobren (su coste en mora se suma a lo que necesita).
// Devuelve, por cada plan: { necesita, cubiertos, fabricados, moraAlquimia }
export function repartirInventario(necesidades, inventario, { alquimia = false } = {}) {
  const disponible = { ...inventario }
  for (const tipoExp of Object.values(EXP)) disponible[tipoExp.id] = expEnInventario(tipoExp, inventario)

  const tomar = (id, cantidad) => {
    const tomado = Math.min(cantidad, disponible[id] ?? 0)
    disponible[id] = (disponible[id] ?? 0) - tomado
    return tomado
  }

  return necesidades.map((necesidad) => {
    const necesita = new Map(necesidad)
    const cubiertos = new Map()
    const fabricados = new Map()
    let moraAlquimia = 0

    // 1) Lo que tienes tal cual
    for (const [id, cantidad] of necesita) cubiertos.set(id, tomar(id, cantidad))

    // 2) Lo que falta, fabricado. Primero los niveles bajos, para que no se gasten en fabricar los altos.
    if (alquimia) {
      const conFalta = [...necesita.keys()]
        .filter((id) => materiales[id]?.receta && cubiertos.get(id) < necesita.get(id))
        .sort((a, b) => profundidad(a) - profundidad(b))
      for (const id of conFalta) {
        const cantidad = Math.min(necesita.get(id) - cubiertos.get(id), maxFabricable(id, disponible))
        if (cantidad <= 0) continue
        moraAlquimia += fabricar(id, cantidad, disponible)
        fabricados.set(id, cantidad)
        cubiertos.set(id, cubiertos.get(id) + cantidad)
      }
      if (moraAlquimia > 0) {
        necesita.set(ID_MORA, (necesita.get(ID_MORA) ?? 0) + moraAlquimia)
        cubiertos.set(ID_MORA, (cubiertos.get(ID_MORA) ?? 0) + tomar(ID_MORA, moraAlquimia))
      }
    }

    return { necesita, cubiertos, fabricados, moraAlquimia }
  })
}

// Datos para mostrar un material (o la EXP, que no es un material real)
export function datosMaterial(id) {
  const exp = EXP_POR_ID[id]
  if (exp) {
    const [idPrincipal] = exp.fuentes[0]
    return { nombre: exp.nombre, tipo: 'EXP', rareza: 4, orden: -1, icono: materiales[idPrincipal].icono, exp }
  }
  return materiales[id]
}

const GRUPOS = [
  { titulo: 'Mora y experiencia', incluye: (m) => m.tipo === 'Moneda común' || m.tipo === 'EXP' },
  { titulo: 'Gemas de ascensión', incluye: (m) => m.tipo === 'Material de ascensión de personaje' },
  { titulo: 'Materiales de jefes', incluye: (m) => m.tipo === 'Material de mejora de personaje' },
  { titulo: 'Especialidades locales', incluye: (m) => m.tipo.startsWith('Objeto típico') },
  { titulo: 'Libros de talento', incluye: (m) => m.tipo === 'Material de talento de personaje' },
  { titulo: 'Materiales de ascensión de arma', incluye: (m) => m.tipo === 'Material de ascensión de arma' },
  { titulo: 'Materiales comunes', incluye: () => true },
]

// Convierte el Map de totales en grupos ordenados para mostrarlos en pantalla
export function agruparMateriales(totales) {
  const grupos = GRUPOS.map((g) => ({ titulo: g.titulo, items: [] }))
  for (const [id, cantidad] of totales) {
    const material = { id, cantidad, ...datosMaterial(id) }
    const indice = GRUPOS.findIndex((g) => g.incluye(material))
    grupos[indice].items.push(material)
  }
  for (const g of grupos) g.items.sort((a, b) => a.orden - b.orden || a.rareza - b.rareza)
  return grupos.filter((g) => g.items.length)
}
