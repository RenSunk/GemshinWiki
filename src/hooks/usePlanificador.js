import { nuevoPlan } from '../utils/calculos.js'
import { useAlmacenado } from './useAlmacenado.js'

// Lista de personajes en el planificador y materiales que ya tienes, guardados en el navegador
export function usePlanificador() {
  const [planes, setPlanes] = useAlmacenado('teyvat-wiki:planificador', [])
  const [inventario, setInventario] = useAlmacenado('teyvat-wiki:inventario', {})

  const estaEnPlan = (slug) => planes.some((p) => p.slug === slug)

  const agregar = (slug) => {
    if (!estaEnPlan(slug)) setPlanes([...planes, nuevoPlan(slug)])
  }

  const quitar = (slug) => setPlanes(planes.filter((p) => p.slug !== slug))

  const actualizar = (slug, cambios) => setPlanes(planes.map((p) => (p.slug === slug ? { ...p, ...cambios } : p)))

  // Cambia la prioridad: direccion -1 sube al personaje en la lista, +1 lo baja
  const mover = (slug, direccion) => {
    const desde = planes.findIndex((p) => p.slug === slug)
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

  return { planes, estaEnPlan, agregar, quitar, actualizar, mover, inventario, cambiarInventario, vaciarInventario }
}
