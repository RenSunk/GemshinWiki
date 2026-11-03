import { useEffect, useState } from 'react'
import { calcularPlan, nuevoPlan } from '../utils/calculos.js'
import ListaMateriales from './ListaMateriales.jsx'

const PESTANAS = ['Efecto', 'Historia', 'Materiales']
const COLOR_ARMA = '#d3bc8e'

export default function DetalleArma({ arma: a, planificador }) {
  const [pestana, setPestana] = useState(PESTANAS[0])
  const enPlan = planificador.estaEnPlan('arma', a.slug)

  const datos = [
    ['Tipo', a.tipo],
    ['ATQ base', `${a.atq[0]} → ${a.atq[1]}`],
    a.stat && [a.stat.nombre, `${a.stat.valores[0]} → ${a.stat.valores[1]}`],
    ['Nivel máximo', a.nivelMax],
    ['Versión', a.version],
  ].filter((fila) => fila && fila[1])

  return (
    <article className="detalle" style={{ '--color': COLOR_ARMA }}>
      <a href="#/armas" className="volver">
        ← Volver a las armas
      </a>

      <div className="detalle-hero detalle-hero-arma">
        <img className="detalle-splash" src={a.imagen} alt={a.nombre} />
        <div className="detalle-info">
          <p className="detalle-titulo">{a.tipo}</p>
          <h1>{a.nombre}</h1>
          <p className="estrellas">{'★'.repeat(a.rareza)}</p>
          {enPlan ? (
            <a href={`#/planificador/arma/${a.slug}`} className="boton-secundario">
              ✓ En el planificador
            </a>
          ) : (
            <button className="boton-principal" onClick={() => planificador.agregar('arma', a)}>
              + Añadir al planificador
            </button>
          )}
          <dl className="datos">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt>{etiqueta}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
          <p className="nota">Valores en nivel 1 → nivel {a.nivelMax} ascendida.</p>
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

      {pestana === 'Efecto' && <Efecto efecto={a.efecto} />}
      {pestana === 'Historia' && <Historia slug={a.slug} />}
      {pestana === 'Materiales' && (
        <div>
          <p className="nota">
            Total para subir del nivel 1 al {a.nivelMax}. Para calcular niveles concretos, usa el{' '}
            <a href="#/planificador">planificador</a>.
          </p>
          <ListaMateriales totales={calcularPlan(a, nuevoPlan('arma', a))} />
        </div>
      )}
    </article>
  )
}

function Efecto({ efecto }) {
  const [refinamiento, setRefinamiento] = useState(0)
  if (!efecto) return <p className="vacio">Esta arma no tiene efecto pasivo.</p>

  // Rellena los huecos {0}, {1}… de la plantilla con los valores del refinamiento elegido, resaltados
  const partes = efecto.texto
    ? [efecto.texto]
    : efecto.plantilla.split(/\{(\d+)\}/).map((trozo, i) =>
        i % 2 ? (
          <strong key={i} className="valor-refinamiento">
            {efecto.valores[refinamiento][trozo]}
          </strong>
        ) : (
          trozo
        ),
      )

  return (
    <div className="habilidad">
      <span className="habilidad-tipo">Efecto pasivo</span>
      <h3>{efecto.nombre}</h3>
      {efecto.valores && (
        <div className="refinamientos" role="group" aria-label="Refinamiento">
          {efecto.valores.map((_, i) => (
            <button key={i} className={refinamiento === i ? 'activo' : ''} onClick={() => setRefinamiento(i)}>
              R{i + 1}
            </button>
          ))}
        </div>
      )}
      <p>{partes}</p>
    </div>
  )
}

// Las historias pesan mucho (más de 600 KB todas juntas): se descargan solo al abrir esta pestaña
function Historia({ slug }) {
  const [historias, setHistorias] = useState(null)

  useEffect(() => {
    import('../data/armas-historias.json').then((modulo) => setHistorias(modulo.default))
  }, [])

  if (!historias) return <p className="vacio">Cargando historia…</p>
  const { descripcion, historia } = historias[slug] ?? {}

  return (
    <div className="habilidad">
      <p className="detalle-descripcion">{descripcion}</p>
      {historia && <p className="historia">{historia}</p>}
    </div>
  )
}
