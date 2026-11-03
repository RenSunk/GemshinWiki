import { useMemo } from 'react'
import { calcularPlan, repartirInventario } from '../utils/calculos.js'
import { tipoDe } from './usePlanificador.js'

// Materiales que necesita cada plan y qué parte cubre el inventario (lo usan el planificador y "Hoy")
export function usePlanCalculado(personajes, armas, planificador) {
  const catalogo = useMemo(
    () => ({
      personaje: new Map(personajes.map((p) => [p.slug, p])),
      arma: new Map(armas.map((a) => [a.slug, a])),
    }),
    [personajes, armas],
  )
  const entidadDe = (plan) => catalogo[tipoDe(plan)].get(plan.slug)

  // Ignora planes guardados cuyo personaje o arma ya no exista en los datos
  const planes = planificador.planes.filter((plan) => entidadDe(plan))
  const necesidades = planes.map((plan) => calcularPlan(entidadDe(plan), plan))
  const repartos = repartirInventario(necesidades, planificador.inventario, { alquimia: planificador.alquimia })

  return { catalogo, entidadDe, planes, necesidades, repartos }
}
