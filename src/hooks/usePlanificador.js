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

  return {
    planes,
    estaEnPlan,
    agregar,
    quitar,
    actualizar,
    mover,
    inventario,
    cambiarInventario,
    vaciarInventario,
    alquimia,
    setAlquimia,
  }
}
