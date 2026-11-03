import { useEffect, useState } from 'react'

// Textos de la página de detalle (talentos, efectos, historias): un archivo por personaje, arma o set.
// Vite los separa en archivos pequeños y el navegador descarga solo el de la página abierta.
const CARGADORES = {
  personaje: import.meta.glob('../data/personajes/*.json', { import: 'default' }),
  arma: import.meta.glob('../data/armas/*.json', { import: 'default' }),
  artefacto: import.meta.glob('../data/artefactos/*.json', { import: 'default' }),
}
const CARPETAS = { personaje: 'personajes', arma: 'armas', artefacto: 'artefactos' }

// Devuelve los datos de detalle, null mientras se descargan o `{ error: true }` si fallan
export function useDetalle(tipo, slug) {
  const [estado, setEstado] = useState({ clave: null, datos: null })
  const clave = `${tipo}/${slug}`

  useEffect(() => {
    let activo = true
    const cargar = CARGADORES[tipo][`../data/${CARPETAS[tipo]}/${slug}.json`]
    const promesa = cargar ? cargar() : Promise.reject(new Error('Sin datos'))
    promesa
      .then((datos) => activo && setEstado({ clave, datos }))
      .catch(() => activo && setEstado({ clave, datos: { error: true } }))
    return () => {
      activo = false
    }
  }, [tipo, slug, clave])

  // Si cambia la página, no se muestran los datos de la anterior mientras llega la nueva
  return estado.clave === clave ? estado.datos : null
}
