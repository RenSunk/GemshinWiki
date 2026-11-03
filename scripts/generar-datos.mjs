// Extrae de genshin-db solo los datos que usa la web (en español) y los guarda
// en src/data/. Así el navegador no carga los 179 MB del paquete.
// Uso: npm run datos
import { writeFileSync, mkdirSync } from 'node:fs'
import genshindb from 'genshin-db'

const ES = { resultLanguage: 'Spanish' }
const IMG = 'https://enka.network/ui'
// Enka no tiene los iconos de los materiales más nuevos; Yatta sí los tiene todos
const IMG_MATERIALES = 'https://gi.yatta.moe/assets/UI'

const ELEMENTOS_VALIDOS = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo']
const ID_INGENIO_DEL_HEROE = 104003

// Los costes se guardan como pares [id, cantidad] para que el JSON pese menos.
// Los nombres e iconos van una sola vez en materiales.json.
const idsUsados = new Set([ID_INGENIO_DEL_HEROE])
function compactar(fase = []) {
  return fase.map(({ id, count }) => {
    idsUsados.add(id)
    return [id, count]
  })
}

const nombresEnIngles = genshindb.characters('names', { matchCategories: true })

const personajes = nombresEnIngles.map((nombreIngles) => {
  const c = genshindb.characters(nombreIngles, ES)
  const t = genshindb.talents(nombreIngles, ES)
  const k = genshindb.constellations(nombreIngles, ES)

  const talento = (x, tipo) => x && { tipo, nombre: x.name, descripcion: x.description }

  return {
    id: c.id,
    slug: nombreIngles.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
})

personajes.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

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
  }
}

const faltantes = [...idsUsados].filter((id) => !materiales[id])
if (faltantes.length) throw new Error(`Materiales sin datos: ${faltantes.join(', ')}`)

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/personajes.json', JSON.stringify(personajes))
writeFileSync('src/data/materiales.json', JSON.stringify(materiales))
console.log(`Listo: ${personajes.length} personajes y ${Object.keys(materiales).length} materiales en src/data/`)
