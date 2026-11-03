import { useState } from 'react'
import { useDetalle } from '../hooks/useDetalle.js'
import Cargando from './Cargando.jsx'

const PESTANAS = ['Bonos', 'Piezas', 'Historia']
const COLOR_ARTEFACTO = '#d3bc8e'

// Los sets que no salen en dominios: los de 5★ caen de jefes de mundo; los de rareza baja, de otras fuentes
function dondeConseguirlo(a) {
  if (a.dominios.length) return a.dominios.map((d) => `${d.entrada} (${d.region})`).join(', ')
  return a.rarezas[1] === 5 ? 'Jefes de mundo (no sale en dominios)' : 'No sale en dominios (cofres y otras fuentes)'
}

export default function DetalleArtefacto({ artefacto: a }) {
  const [pestana, setPestana] = useState(PESTANAS[0])
  const rareza = a.rarezas[0] === a.rarezas[1] ? `${a.rarezas[0]}★` : `${a.rarezas[0]}★ a ${a.rarezas[1]}★`

  const datos = [
    ['Rareza', rareza],
    ['Piezas', a.piezas.length],
    [a.dominios.length > 1 ? 'Dominios' : 'Dónde conseguirlo', dondeConseguirlo(a)],
    ['Versión', a.version],
  ]

  return (
    <article className="detalle" style={{ '--color': COLOR_ARTEFACTO }}>
      <a href="#/artefactos" className="volver">
        ← Volver a los artefactos
      </a>

      <div className="detalle-hero detalle-hero-artefacto">
        <div className={`artefacto-icono-grande rareza-${a.rarezas[1]}`}>
          <img src={a.icono} alt={a.nombre} />
        </div>
        <div className="detalle-info">
          <p className="detalle-titulo">Set de artefactos</p>
          <h1>{a.nombre}</h1>
          <p className="estrellas">{'★'.repeat(a.rarezas[1])}</p>
          <dl className="datos">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta} className={etiqueta === 'Dominios' ? 'dato-ancho' : ''}>
                <dt>{etiqueta}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((nombre) => (
          <button
            key={nombre}
            role="tab"
            aria-selected={pestana === nombre}
            className={pestana === nombre ? 'activa' : ''}
            onClick={() => setPestana(nombre)}
          >
            {nombre}
          </button>
        ))}
      </div>

      {pestana === 'Bonos' && (
        <div className="habilidades">
          {a.bonos.map((b) => (
            <div key={b.piezas} className="habilidad">
              <span className="habilidad-tipo">Bono de {b.piezas} {b.piezas === 1 ? 'pieza' : 'piezas'}</span>
              <p>{b.texto}</p>
            </div>
          ))}
        </div>
      )}
      {pestana === 'Piezas' && (
        <ul className="piezas">
          {a.piezas.map((p) => (
            <li key={p.tipo}>
              <img src={p.icono} alt="" className={`rareza-${a.rarezas[1]}`} loading="lazy" />
              <span className="material-nombre">
                {p.nombre}
                <small>{p.tipo}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {pestana === 'Historia' && <Historia artefacto={a} />}
    </article>
  )
}

// La historia de cada set está en su propio archivo: se descarga solo al abrir esta pestaña
function Historia({ artefacto }) {
  const detalle = useDetalle('artefacto', artefacto.slug)
  if (!detalle || detalle.error) return <Cargando error={detalle?.error} />

  return (
    <div className="habilidades">
      {artefacto.piezas.map((p, i) => {
        const { descripcion, historia } = detalle.piezas[i] ?? {}
        return (
          <div key={p.tipo} className="habilidad">
            <span className="habilidad-tipo">{p.tipo}</span>
            <h3>{p.nombre}</h3>
            <p className="detalle-descripcion">{descripcion}</p>
            {historia && <p className="historia">{historia}</p>}
          </div>
        )
      })}
    </div>
  )
}
