// Reglas de equipo: consonancias elementales y reacciones posibles según los elementos presentes.
// Efectos de las consonancias: wiki oficial de HoYoLAB (entrada "Elemental Resonance").
// Nombres de las reacciones: los que usan los textos del juego en español (talentos, armas y artefactos).

export const TAMANO_EQUIPO = 4
export const ELEMENTOS_JUGABLES = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo']

const CONSONANCIAS = {
  Pyro: 'Reduce un 40% la duración de los efectos Cryo y aumenta el ATQ un 25%.',
  Hydro: 'Reduce un 40% la duración de los efectos Pyro y aumenta la Vida máxima un 25%.',
  Anemo: 'Reduce un 15% el consumo de aguante, aumenta un 10% la velocidad de movimiento y reduce un 5% el TdE de las habilidades.',
  Electro:
    'Reduce un 40% la duración de los efectos Hydro. Superconductor, Sobrecarga, Electrocargado, Aceleración, ' +
    'Intensificación y Sobreflorecimiento generan una partícula elemental Electro (TdE: 5 s).',
  Dendro:
    'Aumenta la maestría elemental en 50. Tras causar Quemadura, Aceleración o Florecimiento, el equipo cercano ' +
    'obtiene 30 de maestría elemental durante 6 s; tras Intensificación, Propagación, Sobreflorecimiento o ' +
    'Crepitar, 20 durante 6 s.',
  Cryo: 'Reduce un 40% la duración de los efectos Electro y aumenta un 15% la prob. CRIT contra enemigos congelados o afectados por Cryo.',
  Geo:
    'Aumenta un 15% la resistencia de los escudos. Los personajes protegidos por un escudo infligen un 15% más de ' +
    'daño, y al golpear reducen un 20% la RES Geo del enemigo durante 15 s.',
}
const CONSONANCIA_CUATRO_ELEMENTOS = 'Todas las RES elementales y la RES física aumentan un 15%.'

// Con 4 personajes: cada elemento repetido da su consonancia; 4 elementos distintos dan una especial.
// Devuelve [] si el equipo no está completo (en el juego no se activan con menos de 4).
export function consonancias(elementos) {
  if (elementos.length < TAMANO_EQUIPO) return []
  const cuenta = new Map()
  for (const e of elementos) cuenta.set(e, (cuenta.get(e) ?? 0) + 1)

  const activas = [...cuenta]
    .filter(([, n]) => n >= 2)
    .map(([e]) => ({ clave: e, nombre: `Consonancia ${e}`, requisito: `2 personajes ${e}`, efecto: CONSONANCIAS[e], elementos: [e] }))

  if (cuenta.size === TAMANO_EQUIPO) {
    activas.push({
      clave: 'cuatro',
      nombre: 'Consonancia de 4 elementos',
      requisito: '4 elementos distintos',
      efecto: CONSONANCIA_CUATRO_ELEMENTOS,
      elementos: [...cuenta.keys()],
    })
  }
  return activas
}

const ELEMENTOS_BASICOS = ['Pyro', 'Hydro', 'Electro', 'Cryo']

const REACCIONES = [
  { nombre: 'Vaporización', requiere: [['Pyro'], ['Hydro']], descripcion: 'Multiplica el daño: ×2 si Hydro golpea sobre Pyro, ×1,5 si Pyro golpea sobre Hydro.' },
  { nombre: 'Derretido', requiere: [['Pyro'], ['Cryo']], descripcion: 'Multiplica el daño: ×2 si Pyro golpea sobre Cryo, ×1,5 si Cryo golpea sobre Pyro.' },
  { nombre: 'Sobrecarga', requiere: [['Pyro'], ['Electro']], descripcion: 'Explosión Pyro en área que empuja a los enemigos.' },
  { nombre: 'Congelación', requiere: [['Hydro'], ['Cryo']], descripcion: 'Inmoviliza a los enemigos durante un tiempo.' },
  { nombre: 'Electrocargado', requiere: [['Hydro'], ['Electro']], descripcion: 'Daño Electro continuo que salta a enemigos mojados cercanos.' },
  { nombre: 'Superconductor', requiere: [['Cryo'], ['Electro']], descripcion: 'Daño Cryo en área y reduce un 40% la RES física de los enemigos durante 12 s.' },
  { nombre: 'Torbellino', requiere: [['Anemo'], ELEMENTOS_BASICOS], descripcion: 'Esparce el elemento del enemigo (Pyro, Hydro, Electro o Cryo) a los de alrededor.' },
  { nombre: 'Cristalización', requiere: [['Geo'], ELEMENTOS_BASICOS], descripcion: 'Suelta un fragmento que, al recogerlo, da un escudo del elemento.' },
  { nombre: 'Quemadura', requiere: [['Dendro'], ['Pyro']], descripcion: 'Daño Pyro continuo en área.' },
  { nombre: 'Florecimiento', requiere: [['Dendro'], ['Hydro']], descripcion: 'Crea núcleos Dendro que explotan al poco tiempo.' },
  { nombre: 'Sobreflorecimiento', requiere: [['Dendro'], ['Hydro'], ['Electro']], descripcion: 'Golpear los núcleos con Electro lanza proyectiles que buscan enemigos.' },
  { nombre: 'Crepitar', requiere: [['Dendro'], ['Hydro'], ['Pyro']], descripcion: 'Golpear los núcleos con Pyro los hace explotar en un área mayor.' },
  {
    nombre: 'Aceleración',
    requiere: [['Dendro'], ['Electro']],
    descripcion: 'Deja a los enemigos acelerados: los golpes Electro causan Intensificación y los Dendro, Propagación, con más daño.',
  },
]

// Una reacción es posible si el equipo tiene al menos un elemento de cada grupo de `requiere`
export function reaccionesPosibles(elementos) {
  const hay = new Set(elementos)
  return REACCIONES.filter((r) => r.requiere.every((grupo) => grupo.some((e) => hay.has(e)))).map((r) => ({
    ...r,
    elementos: r.requiere.map((grupo) => grupo.filter((e) => hay.has(e))).flat(),
  }))
}

// ---------- Equipo en la URL: #/equipos/hu-tao,xingqiu,aether.anemo, ----------
// Cada casilla es el slug del personaje; los de elemento variable llevan ".elemento"; vacía = ""

export function equipoATexto(casillas) {
  return casillas.map((c) => (c ? (c.elemento ? `${c.slug}.${c.elemento.toLowerCase()}` : c.slug) : '')).join(',')
}

export function textoAEquipo(texto, porSlug) {
  const casillas = (texto ?? '').split(',').slice(0, TAMANO_EQUIPO)
  const vistos = new Set()
  const resultado = casillas.map((parte) => {
    const [slug, elemento] = parte.split('.')
    const personaje = porSlug.get(slug)
    if (!personaje || vistos.has(slug)) return null
    vistos.add(slug)
    if (personaje.elemento !== 'Variable') return { slug }
    const elegido = ELEMENTOS_JUGABLES.find((e) => e.toLowerCase() === elemento)
    return { slug, elemento: elegido ?? ELEMENTOS_JUGABLES[0] }
  })
  while (resultado.length < TAMANO_EQUIPO) resultado.push(null)
  return resultado
}
