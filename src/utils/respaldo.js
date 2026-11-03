import { NIVELES } from './calculos.js'

// Copia de seguridad del planificador: plan, inventario y opción de alquimia.
// Sirve para pasarlo a otro dispositivo como archivo o como enlace.

const APP = 'genshin-wiki'
const VERSION = 1

export const crearRespaldo = ({ planes, inventario, alquimia }) => ({ app: APP, version: VERSION, planes, inventario, alquimia })

const esEntero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max

// Errores con un mensaje pensado para mostrarlo tal cual en pantalla
function errorDeRespaldo(mensaje) {
  const error = new Error(mensaje)
  error.name = 'ErrorDeRespaldo'
  return error
}

function validarPlan(plan) {
  if (!plan || typeof plan.slug !== 'string' || !/^[a-z0-9-]+$/.test(plan.slug)) return null
  const tipo = plan.tipo ?? 'personaje'
  if (tipo !== 'personaje' && tipo !== 'arma') return null
  const ultimo = NIVELES.length - 1
  if (!esEntero(plan.nivelActual, 0, ultimo) || !esEntero(plan.nivelObjetivo, plan.nivelActual, ultimo)) return null
  if (tipo === 'arma') return { tipo, slug: plan.slug, nivelActual: plan.nivelActual, nivelObjetivo: plan.nivelObjetivo }

  const talentos = plan.talentos
  const talentosValidos =
    Array.isArray(talentos) &&
    talentos.length === 3 &&
    talentos.every((t) => Array.isArray(t) && esEntero(t[0], 1, 10) && esEntero(t[1], t[0], 10))
  if (!talentosValidos) return null
  return { tipo, slug: plan.slug, nivelActual: plan.nivelActual, nivelObjetivo: plan.nivelObjetivo, talentos }
}

// Comprueba un respaldo que viene de fuera (archivo o enlace) y devuelve solo lo válido.
// Lanza un Error con un mensaje para el usuario si no es un respaldo de esta web.
export function leerRespaldo(datos) {
  if (!datos || datos.app !== APP || !Array.isArray(datos.planes)) {
    throw errorDeRespaldo('No es una copia del planificador de Genshin Wiki.')
  }
  if (datos.version > VERSION) {
    throw errorDeRespaldo('Esta copia se hizo con una versión más nueva de la web. Recarga la página e inténtalo de nuevo.')
  }

  const vistos = new Set()
  const planes = datos.planes.map(validarPlan).filter((plan) => {
    const clave = plan && `${plan.tipo}/${plan.slug}`
    if (!plan || vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })

  const inventario = {}
  for (const [id, cantidad] of Object.entries(datos.inventario ?? {})) {
    if (/^\d+$/.test(id) && esEntero(cantidad, 1, 1e12)) inventario[id] = cantidad
  }

  return { planes, inventario, alquimia: datos.alquimia !== false }
}

// El enlace lleva el respaldo en el hash: #/importar/<base64url>
export function respaldoAEnlace(respaldo) {
  const base64 = btoa(JSON.stringify(respaldo)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${window.location.origin}${window.location.pathname}#/importar/${base64}`
}

export function enlaceARespaldo(codigo) {
  try {
    const base64 = codigo.replace(/-/g, '+').replace(/_/g, '/')
    return leerRespaldo(JSON.parse(atob(base64)))
  } catch (error) {
    throw error.name === 'ErrorDeRespaldo' ? error : errorDeRespaldo('El enlace está incompleto o dañado.')
  }
}
