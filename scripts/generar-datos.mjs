// Extrae de genshin-db solo los datos que usa la web (en español) y los guarda
// en src/data/. Así el navegador no carga los 179 MB del paquete.
// Los textos que solo se ven en la página de detalle (talentos, efectos, historias) van en un
// archivo por personaje, arma o set: el navegador descarga solo el de la página que se abre.
// Uso: npm run datos
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import genshindb from 'genshin-db'

const ES = { resultLanguage: 'Spanish' }
const IMG = 'https://enka.network/ui'
// Enka no tiene los iconos de los materiales más nuevos; Yatta sí los tiene todos
const IMG_MATERIALES = 'https://gi.yatta.moe/assets/UI'

const ELEMENTOS_VALIDOS = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo']
// Libros de EXP de personaje y minerales de EXP de arma: el inventario los usa aunque
// ningún coste los nombre directamente
const IDS_EXP = [104003, 104002, 104001, 104013, 104012, 104011]

const aSlug = (nombreIngles) => nombreIngles.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// Los costes se guardan como pares [id, cantidad] para que el JSON pese menos.
// Los nombres e iconos van una sola vez en materiales.json.
const idsUsados = new Set(IDS_EXP)
function compactar(fase = []) {
  return fase.map(({ id, count }) => {
    idsUsados.add(id)
    return [id, count]
  })
}

// ---------- Personajes ----------
const detallesPersonajes = {}
const personajes = genshindb.characters('names', { matchCategories: true }).map((nombreIngles) => {
  const c = genshindb.characters(nombreIngles, ES)
  const t = genshindb.talents(nombreIngles, ES)
  const k = genshindb.constellations(nombreIngles, ES)

  const talento = (x, tipo) => x && { tipo, nombre: x.name, descripcion: x.description }
  const slug = aSlug(nombreIngles)

  detallesPersonajes[slug] = {
    talentos: t
      ? [
          talento(t.combat1, 'Ataque normal'),
          talento(t.combat2, 'Habilidad elemental'),
          talento(t.combat3, 'Habilidad definitiva'),
          talento(t.passive1, 'Pasiva'),
          talento(t.passive2, 'Pasiva'),
          talento(t.passive3, 'Pasiva'),
        ].filter(Boolean)
      : [],
    constelaciones: k
      ? ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((n) => ({ nombre: k[n].name, descripcion: k[n].description }))
      : [],
  }

  return {
    id: c.id,
    slug,
    nombre: c.name,
    titulo: c.title,
    descripcion: c.description,
    rareza: c.rarity,
    elemento: ELEMENTOS_VALIDOS.includes(c.elementText) ? c.elementText : 'Variable',
    arma: c.weaponText,
    region: c.region || 'Desconocida',
    afiliacion: c.affiliation,
    cumpleanos: c.birthday,
    constelacion: c.constellation,
    stat: c.substatText,
    version: c.version,
    icono: `${IMG}/${c.images.filename_icon}.png`,
    splash: `${IMG}/${c.images.filename_gachaSplash}.png`,
    // costesAscension[0] = fase 1 … [5] = fase 6
    costesAscension: ['ascend1', 'ascend2', 'ascend3', 'ascend4', 'ascend5', 'ascend6'].map((f) => compactar(c.costs?.[f])),
    // costesTalento[0] = subir de nivel 1 a 2 … [8] = de 9 a 10 (igual para los 3 talentos)
    costesTalento: t?.costs
      ? ['lvl2', 'lvl3', 'lvl4', 'lvl5', 'lvl6', 'lvl7', 'lvl8', 'lvl9', 'lvl10'].map((n) => compactar(t.costs[n]))
      : [],
  }
})
personajes.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

// ---------- Armas ----------
// La stat secundaria viene como número (0.144); baseStatText dice si es porcentaje ("14,4%")
function formatearStat(valor, esPorcentaje) {
  return esPorcentaje ? `${(valor * 100).toFixed(1).replace('.', ',')}%` : String(Math.round(valor))
}

// El texto del efecto va una sola vez con huecos {0}, {1}…; cada refinamiento solo trae sus valores.
// Las armas que no se pueden refinar (exclusivas de PlayStation, de misión) solo traen el texto de R1.
function extraerEfecto(w) {
  if (!w.r1) return null
  const refinamientos = ['r1', 'r2', 'r3', 'r4', 'r5'].map((r) => w[r]?.values)
  if (refinamientos.every((v) => v?.length)) {
    return { nombre: w.effectName, plantilla: w.effectTemplateRaw.replace(/<\/?color[^>]*>/g, ''), valores: refinamientos }
  }
  return { nombre: w.effectName, texto: w.r1.description }
}

const detallesArmas = {}
const slugsVistos = new Set()
const nombresArmas = genshindb.weapons('names', { matchCategories: true }).filter((nombreIngles) => {
  // Algunas armas de misión aparecen repetidas con el mismo nombre
  const slug = aSlug(nombreIngles)
  if (slugsVistos.has(slug)) return false
  slugsVistos.add(slug)
  return true
})
const armas = nombresArmas.map((nombreIngles) => {
  const w = genshindb.weapons(nombreIngles, ES)
  const slug = aSlug(nombreIngles)
  const fases = Object.keys(w.costs).length // 4 en armas de 1-2★ (nivel máx. 70), 6 en el resto
  const nivelMax = fases === 6 ? 90 : 70
  const minimo = w.stats(1)
  const maximo = w.stats(nivelMax, '+')
  const esPorcentaje = w.baseStatText?.endsWith('%')

  detallesArmas[slug] = { efecto: extraerEfecto(w), descripcion: w.description, historia: w.story ?? '' }

  return {
    id: w.id,
    slug,
    nombre: w.name,
    rareza: w.rarity,
    tipo: w.weaponText,
    version: w.version,
    icono: `${IMG}/${w.images.filename_icon}.png`,
    imagen: `${IMG}/${w.images.filename_gacha}.png`,
    nivelMax,
    atq: [Math.round(minimo.attack), Math.round(maximo.attack)],
    stat: w.mainStatText
      ? { nombre: w.mainStatText, valores: [w.baseStatText, formatearStat(maximo.specialized, esPorcentaje)] }
      : null,
    costesAscension: Object.keys(w.costs)
      .sort()
      .map((f) => compactar(w.costs[f])),
  }
})
armas.sort((a, b) => b.rareza - a.rareza || a.nombre.localeCompare(b.nombre, 'es'))

// ---------- Artefactos ----------
// Dominio de cada set: las recompensas de los dominios de artefactos nombran los sets que dan
const dominiosDeArtefactos = genshindb
  .domains('names', { matchCategories: true })
  .map((nombre) => genshindb.domains(nombre, ES))
  .filter((d) => d?.domainType === 'UI_ABYSSUS_RELIC')

function dominiosDelSet(nombreSet) {
  const entradas = new Map()
  for (const d of dominiosDeArtefactos) {
    if (d.rewardPreview?.some((r) => r.name === nombreSet)) {
      entradas.set(d.entranceName, { entrada: d.entranceName, region: d.regionName })
    }
  }
  return [...entradas.values()].sort((a, b) => a.region.localeCompare(b.region, 'es'))
}

const PIEZAS = ['flower', 'plume', 'sands', 'goblet', 'circlet']
const detallesArtefactos = {}
const artefactos = genshindb.artifacts('names', { matchCategories: true }).map((nombreIngles) => {
  const s = genshindb.artifacts(nombreIngles, ES)
  const slug = aSlug(nombreIngles)
  const piezas = PIEZAS.filter((p) => s[p])

  detallesArtefactos[slug] = { piezas: piezas.map((p) => ({ descripcion: s[p].description, historia: s[p].story ?? '' })) }

  return {
    id: s.id,
    slug,
    nombre: s.name,
    rarezas: [Math.min(...s.rarityList), Math.max(...s.rarityList)],
    version: s.version,
    bonos: [
      s.effect1Pc && { piezas: 1, texto: s.effect1Pc },
      s.effect2Pc && { piezas: 2, texto: s.effect2Pc },
      s.effect4Pc && { piezas: 4, texto: s.effect4Pc },
    ].filter(Boolean),
    dominios: dominiosDelSet(s.name),
    icono: `${IMG}/${s.images[`filename_${piezas[0]}`]}.png`,
    piezas: piezas.map((p) => ({
      tipo: s[p].relicText,
      nombre: s[p].name,
      icono: `${IMG}/${s.images[`filename_${p}`]}.png`,
    })),
  }
})
artefactos.sort((a, b) => b.rarezas[1] - a.rarezas[1] || a.nombre.localeCompare(b.nombre, 'es'))

// ---------- Recetas de alquimia (3 de un nivel → 1 del siguiente) ----------
const recetas = {}
for (const nombreIngles of genshindb.crafts('names', { matchCategories: true })) {
  const receta = genshindb.crafts(nombreIngles, ES)
  const resultado = genshindb.materials(nombreIngles)
  if (!receta || !resultado || receta.recipe.length !== 1) continue
  const [ingrediente] = receta.recipe
  if (!idsUsados.has(resultado.id)) continue
  idsUsados.add(ingrediente.id)
  recetas[resultado.id] = { de: ingrediente.id, cantidad: ingrediente.count, mora: receta.moraCost ?? 0 }
}

// ---------- Dominios ----------
// Los materiales traen el nombre del nivel ("Dominio de la maestría: Aro de fuego"); para la web
// sirve más la entrada que se ve en el mapa ("Mansión Taishan") y su región
const dominiosPorId = new Map(
  genshindb
    .domains('names', { matchCategories: true })
    .map((nombre) => genshindb.domains(nombre, ES))
    .filter(Boolean)
    .map((d) => [d.id, { entrada: d.entranceName, region: d.regionName }]),
)

// ---------- Materiales ----------
const todosLosMateriales = genshindb.materials('names', { ...ES, matchCategories: true, verboseCategories: true })
const materiales = {}
for (const m of todosLosMateriales) {
  if (!idsUsados.has(m.id)) continue
  materiales[m.id] = {
    nombre: m.name,
    tipo: m.typeText,
    rareza: m.rarity ?? 1,
    orden: m.sortRank ?? 0,
    icono: `${IMG_MATERIALES}/${m.images.filename_icon}.png`,
    ...(m.daysOfWeek && { dias: m.daysOfWeek }),
    ...(dominiosPorId.has(m.dropDomainId) && { dominio: dominiosPorId.get(m.dropDomainId) }),
    ...(recetas[m.id] && { receta: recetas[m.id] }),
  }
}

const faltantes = [...idsUsados].filter((id) => !materiales[id])
if (faltantes.length) throw new Error(`Materiales sin datos: ${faltantes.join(', ')}`)

// Un archivo por slug; la carpeta se vacía antes para no dejar archivos de entradas que ya no existan
function escribirDetalles(carpeta, detalles) {
  rmSync(carpeta, { recursive: true, force: true })
  mkdirSync(carpeta, { recursive: true })
  for (const [slug, datos] of Object.entries(detalles)) writeFileSync(`${carpeta}/${slug}.json`, JSON.stringify(datos))
}

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/personajes.json', JSON.stringify(personajes))
writeFileSync('src/data/armas.json', JSON.stringify(armas))
writeFileSync('src/data/artefactos.json', JSON.stringify(artefactos))
writeFileSync('src/data/materiales.json', JSON.stringify(materiales))
escribirDetalles('src/data/personajes', detallesPersonajes)
escribirDetalles('src/data/armas', detallesArmas)
escribirDetalles('src/data/artefactos', detallesArtefactos)
console.log(
  `Listo: ${personajes.length} personajes, ${armas.length} armas, ${artefactos.length} sets de artefactos, ` +
    `${Object.keys(materiales).length} materiales ` +
    `(${Object.keys(recetas).length} con receta) en src/data/`,
)
