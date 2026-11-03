import { useEffect, useState } from 'react'
import personajes from './data/personajes.json'
import armas from './data/armas.json'
import artefactos from './data/artefactos.json'
import Galeria from './components/Galeria.jsx'
import GaleriaArmas from './components/GaleriaArmas.jsx'
import DetallePersonaje from './components/DetallePersonaje.jsx'
import DetalleArma from './components/DetalleArma.jsx'
import GaleriaArtefactos from './components/GaleriaArtefactos.jsx'
import DetalleArtefacto from './components/DetalleArtefacto.jsx'
import Planificador from './components/Planificador.jsx'
import Hoy from './components/Hoy.jsx'
import ImportarEnlace from './components/ImportarEnlace.jsx'
import Equipos from './components/Equipos.jsx'
import Gachapon from './components/Gachapon.jsx'
import ImportarEnka from './components/ImportarEnka.jsx'
import { usePlanificador } from './hooks/usePlanificador.js'

// Navegación sencilla con el hash de la URL:
// #/, #/personaje/hu-tao, #/armas, #/arma/staff-of-homa, #/artefactos, #/artefacto/gladiators-finale,
// #/equipos/hu-tao,xingqiu,…, #/gachapon, #/hoy, #/planificador,
// #/planificador/arma/staff-of-homa, #/importar/<copia del plan>, #/enka
function leerRuta() {
  const [, seccion = '', ...resto] = window.location.hash.split('/')
  return { seccion, resto }
}

// Los enlaces antiguos #/planificador/hu-tao siguen abriendo al personaje
const claveDelPlanificador = (resto) => (resto.length === 2 ? resto.join('/') : resto[0] ? `personaje/${resto[0]}` : null)

const MENU = [
  { href: '#/', texto: 'Personajes', secciones: ['', 'personaje'] },
  { href: '#/armas', texto: 'Armas', secciones: ['armas', 'arma'] },
  { href: '#/artefactos', texto: 'Artefactos', secciones: ['artefactos', 'artefacto'] },
  { href: '#/equipos', texto: 'Equipos', secciones: ['equipos'] },
  { href: '#/gachapon', texto: 'Gachapón', secciones: ['gachapon'] },
  { href: '#/hoy', texto: 'Hoy', secciones: ['hoy'] },
  { href: '#/planificador', texto: 'Planificador', secciones: ['planificador', 'importar', 'enka'] },
]

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

  const { seccion, resto } = ruta
  const personaje = seccion === 'personaje' && personajes.find((p) => p.slug === resto[0])
  const arma = seccion === 'arma' && armas.find((a) => a.slug === resto[0])
  const artefacto = seccion === 'artefacto' && artefactos.find((a) => a.slug === resto[0])

  let pagina
  if (personaje) {
    pagina = <DetallePersonaje key={personaje.slug} personaje={personaje} planificador={planificador} />
  } else if (arma) {
    pagina = <DetalleArma key={arma.slug} arma={arma} planificador={planificador} />
  } else if (artefacto) {
    pagina = <DetalleArtefacto key={artefacto.slug} artefacto={artefacto} />
  } else if (seccion === 'artefactos') {
    pagina = <GaleriaArtefactos artefactos={artefactos} />
  } else if (seccion === 'equipos') {
    pagina = <Equipos key={resto[0] ?? ''} personajes={personajes} textoInicial={resto[0]} />
  } else if (seccion === 'enka') {
    pagina = <ImportarEnka personajes={personajes} armas={armas} planificador={planificador} />
  } else if (seccion === 'gachapon') {
    pagina = <Gachapon personajes={personajes} armas={armas} />
  } else if (seccion === 'hoy') {
    pagina = <Hoy personajes={personajes} armas={armas} planificador={planificador} />
  } else if (seccion === 'importar') {
    pagina = <ImportarEnlace codigo={resto[0] ?? ''} planificador={planificador} />
  } else if (seccion === 'armas') {
    pagina = <GaleriaArmas armas={armas} />
  } else if (seccion === 'planificador') {
    const clave = claveDelPlanificador(resto)
    pagina = (
      <Planificador key={clave} personajes={personajes} armas={armas} planificador={planificador} claveInicial={clave} />
    )
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
          {MENU.map((item) => (
            <a key={item.href} href={item.href} className={item.secciones.includes(seccion) ? 'activo' : ''}>
              {item.texto}
              {item.href === '#/planificador' && planificador.planes.length > 0 && (
                <span className="insignia">{planificador.planes.length}</span>
              )}
            </a>
          ))}
        </nav>
      </header>

      <main className="contenido">{pagina}</main>

      <footer className="pie">
        Sitio de fans no oficial, sin fines comerciales. No está afiliado con HoYoverse.
        Genshin Impact y todos sus personajes e imágenes son propiedad de HoYoverse.
        Datos: <a href="https://github.com/theBowja/genshin-db">genshin-db</a> · Imágenes:{' '}
        <a href="https://enka.network">Enka.Network</a> y <a href="https://gi.yatta.moe">Yatta</a>
      </footer>
    </>
  )
}
