import materiales from '../data/materiales.json'

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// Para mostrar la semana empezando en lunes
export const DIAS_SEMANA = [...DIAS.slice(1), DIAS[0]]

// El juego cambia de día a las 4:00 (hora del servidor). Se usa la hora local como aproximación:
// antes de las 4:00 todavía cuenta como el día anterior.
const HORA_DE_REINICIO = 4

export function diaDelJuego(fecha = new Date()) {
  const ajustada = new Date(fecha.getTime() - HORA_DE_REINICIO * 60 * 60 * 1000)
  return DIAS[ajustada.getDay()]
}

// Agrupa por dominio los materiales con días de farmeo que aún faltan, sumando lo de todos los planes.
// Los días salen de los datos: si el juego dejara de rotar los dominios, bastaría con actualizar genshin-db.
export function materialesPorDominio(planes, repartos, entidadDe) {
  const dominios = new Map()

  planes.forEach((plan, i) => {
    const { necesita, cubiertos } = repartos[i]
    for (const [id, cantidad] of necesita) {
      const material = materiales[id]
      const faltan = cantidad - (cubiertos.get(id) ?? 0)
      if (!material?.dias || faltan <= 0) continue

      const clave = `${material.dominio.entrada}|${material.dias.join(',')}`
      if (!dominios.has(clave)) {
        dominios.set(clave, {
          clave,
          dominio: material.dominio.entrada,
          region: material.dominio.region,
          dias: material.dias,
          deTalentos: material.tipo === 'Material de talento de personaje',
          materiales: new Map(),
        })
      }
      const porMaterial = dominios.get(clave).materiales
      if (!porMaterial.has(id)) porMaterial.set(id, { id, ...material, faltan: 0, para: [] })
      const entrada = porMaterial.get(id)
      entrada.faltan += faltan
      entrada.para.push({ nombre: entidadDe(plan).nombre, faltan })
    }
  })

  return [...dominios.values()]
    .map((d) => ({ ...d, materiales: [...d.materiales.values()].sort((a, b) => a.orden - b.orden || a.rareza - b.rareza) }))
    .sort((a, b) => Number(b.deTalentos) - Number(a.deTalentos) || a.dominio.localeCompare(b.dominio, 'es'))
}
