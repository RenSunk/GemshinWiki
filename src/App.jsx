import { useEffect, useState } from 'react'
import personajes from './data/personajes.json'
import Galeria from './components/Galeria.jsx'
import DetallePersonaje from './components/DetallePersonaje.jsx'
import Planificador from './components/Planificador.jsx'
import { usePlanificador } from './hooks/usePlanificador.js'

// Navegación sencilla con el hash de la URL: #/, #/personaje/hu-tao, #/planificador
function leerRuta() {
  const [, seccion = '', slug] = window.location.hash.split('/')
  return { seccion, slug }
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta)
  const planificador = usePlanificador()

  useEffect(() => {
    const alCambiar = () => {
      setRuta(leerRuta())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const personaje = ruta.seccion === 'personaje' && personajes.find((p) => p.slug === ruta.slug)

  let pagina
  if (personaje) {
    pagina = <DetallePersonaje key={personaje.slug} personaje={personaje} planificador={planificador} />
  } else if (ruta.seccion === 'planificador') {
    pagina = <Planificador key={ruta.slug} personajes={personajes} planificador={planificador} slugInicial={ruta.slug} />
  } else {
    pagina = <Galeria personajes={personajes} />
  }

  return (
    <>
      <header className="cabecera">
        <a href="#/" className="logo">
          <span className="logo-estrella">✦</span> Genshin Wiki
        </a>
        <nav className="menu">
          <a href="#/" className={ruta.seccion !== 'planificador' ? 'activo' : ''}>
            Personajes
          </a>
          <a href="#/planificador" className={ruta.seccion === 'planificador' ? 'activo' : ''}>
            Planificador
            {planificador.planes.length > 0 && <span className="insignia">{planificador.planes.length}</span>}
          </a>
        </nav>
      </header>

      <main className="contenido">{pagina}</main>

      <footer className="pie">
        Sitio de fans no oficial, sin fines comerciales. No está afiliado con HoYoverse.
        Genshin Impact y todos sus personajes e imágenes son propiedad de HoYoverse.
        Datos: <a href="https://github.com/theBowja/genshin-db">genshin-db</a> · Imágenes:{' '}
        <a href="https://enka.network">Enka.Network</a>
      </footer>
    </>
  )
}
