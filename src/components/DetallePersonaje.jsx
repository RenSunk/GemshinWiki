import { useState } from 'react'
import { COLORES_ELEMENTO } from '../utils/constantes.js'
import { calcularPlan, nuevoPlan } from '../utils/calculos.js'
import { useDetalle } from '../hooks/useDetalle.js'
import ListaMateriales from './ListaMateriales.jsx'
import Cargando from './Cargando.jsx'

const PESTANAS = ['Talentos', 'Constelaciones', 'Materiales']

export default function DetallePersonaje({ personaje: p, planificador }) {
  const [pestana, setPestana] = useState(PESTANAS[0])
  const detalle = useDetalle('personaje', p.slug)
  const color = COLORES_ELEMENTO[p.elemento]
  const enPlan = planificador.estaEnPlan('personaje', p.slug)

  const datos = [
    ['Elemento', p.elemento],
    ['Arma', p.arma],
    ['Región', p.region],
    ['Afiliación', p.afiliacion],
    ['Cumpleaños', p.cumpleanos],
    ['Constelación', p.constelacion],
    ['Stat de ascensión', p.stat],
    ['Versión', p.version],
  ].filter(([, valor]) => valor)

  return (
    <article className="detalle" style={{ '--color': color }}>
      <a href="#/" className="volver">
        ← Volver a la galería
      </a>

      <div className="detalle-hero">
        <img className="detalle-splash" src={p.splash} alt={p.nombre} />
        <div className="detalle-info">
          <p className="detalle-titulo">{p.titulo}</p>
          <h1>{p.nombre}</h1>
          <p className="estrellas">{'★'.repeat(p.rareza)}</p>
          <p className="detalle-descripcion">{p.descripcion}</p>
          {enPlan ? (
            <a href={`#/planificador/personaje/${p.slug}`} className="boton-secundario">
              ✓ En el planificador
            </a>
          ) : (
            <button className="boton-principal" onClick={() => planificador.agregar('personaje', p)}>
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

      {pestana !== 'Materiales' && (!detalle || detalle.error) && <Cargando error={detalle?.error} />}
      {pestana === 'Talentos' && detalle?.talentos && <ListaHabilidades items={detalle.talentos} />}
      {pestana === 'Constelaciones' && detalle?.constelaciones && (
        <ListaHabilidades items={detalle.constelaciones.map((c, i) => ({ ...c, tipo: `C${i + 1}` }))} />
      )}
      {pestana === 'Materiales' && <Materiales personaje={p} />}
    </article>
  )
}

function ListaHabilidades({ items }) {
  if (!items.length) {
    return <p className="vacio">Este personaje cambia según el elemento elegido; sus datos aún no están disponibles.</p>
  }
  return (
    <div className="habilidades">
      {items.map((h, i) => (
        <div key={i} className="habilidad">
          <span className="habilidad-tipo">{h.tipo}</span>
          <h3>{h.nombre}</h3>
          <p>{h.descripcion}</p>
        </div>
      ))}
    </div>
  )
}

function Materiales({ personaje }) {
  const talentosAlMaximo = personaje.costesTalento.length > 0
  return (
    <div>
      <p className="nota">
        Total para subir del nivel 1 al 90{talentosAlMaximo && ' y los 3 talentos del 1 al 10'}. Para
        calcular niveles concretos, usa el <a href="#/planificador">planificador</a>.
      </p>
      <ListaMateriales totales={calcularPlan(personaje, nuevoPlan('personaje', personaje))} />
    </div>
  )
}
