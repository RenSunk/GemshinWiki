import { nuevoPlan } from '../utils/calculos.js'
import { useAlmacenado } from './useAlmacenado.js'

// Los planes guardados antes de que existieran las armas no tienen `tipo`: son personajes
export const tipoDe = (plan) => plan.tipo ?? 'personaje'
export const claveDe = (plan) => `${tipoDe(plan)}/${plan.slug}`

// Personajes y armas en el planificador, materiales que ya tienes y opciones; todo guardado en el navegador
export function usePlanificador() {
  const [planes, setPlanes] = useAlmacenado('teyvat-wiki:planificador', [])
  const [inventario, setInventario] = useAlmacenado('teyvat-wiki:inventario', {})
  const [alquimia, setAlquimia] = useAlmacenado('teyvat-wiki:alquimia', true)

  const estaEnPlan = (tipo, slug) => planes.some((p) => claveDe(p) === `${tipo}/${slug}`)

  const agregar = (tipo, entidad) => {
    if (!estaEnPlan(tipo, entidad.slug)) setPlanes([...planes, nuevoPlan(tipo, entidad)])
  }

  // Añade o actualiza varios planes con los niveles reales del juego (importados de Enka.Network).
  // `actuales`: [{ tipo, entidad, nivelActual, talentos? }] con talentos = [na, habilidad, definitiva].
  // Si ya estaba en el plan, se actualiza lo actual y los objetivos solo suben si quedan por debajo.
  const importarNiveles = (actuales) => {
    let nuevos = [...planes]
    for (const { tipo, entidad, nivelActual, talentos } of actuales) {
      const clave = `${tipo}/${entidad.slug}`
      const indice = nuevos.findIndex((p) => claveDe(p) === clave)
      const base = indice >= 0 ? nuevos[indice] : nuevoPlan(tipo, entidad)
      const plan = { ...base, nivelActual, nivelObjetivo: Math.max(base.nivelObjetivo, nivelActual) }
      if (base.talentos && talentos) {
        plan.talentos = base.talentos.map(([, objetivo], i) => [talentos[i], Math.max(objetivo, talentos[i])])
      }
      nuevos = indice >= 0 ? nuevos.map((p, i) => (i === indice ? plan : p)) : [...nuevos, plan]
    }
    setPlanes(nuevos)
  }

  const quitar = (clave) => setPlanes(planes.filter((p) => claveDe(p) !== clave))

  const actualizar = (clave, cambios) => setPlanes(planes.map((p) => (claveDe(p) === clave ? { ...p, ...cambios } : p)))

  // Cambia la prioridad: direccion -1 lo adelanta en la lista, +1 lo atrasa
  const mover = (clave, direccion) => {
    const desde = planes.findIndex((p) => claveDe(p) === clave)
    const hasta = desde + direccion
    if (desde < 0 || hasta < 0 || hasta >= planes.length) return
    const nuevos = [...planes]
    ;[nuevos[desde], nuevos[hasta]] = [nuevos[hasta], nuevos[desde]]
    setPlanes(nuevos)
  }

  const cambiarInventario = (id, cantidad) => {
    const { [id]: _anterior, ...resto } = inventario
    setInventario(cantidad > 0 ? { ...resto, [id]: cantidad } : resto)
  }

  const vaciarInventario = () => setInventario({})

  // Reemplaza todo con lo que viene de una copia de seguridad (ya validada con leerRespaldo)
  const restaurar = (respaldo) => {
    setPlanes(respaldo.planes)
    setInventario(respaldo.inventario)
    setAlquimia(respaldo.alquimia)
  }

  return {
    planes,
    estaEnPlan,
    agregar,
    importarNiveles,
    quitar,
    actualizar,
    mover,
    inventario,
    cambiarInventario,
    vaciarInventario,
    alquimia,
    setAlquimia,
    restaurar,
  }
}
