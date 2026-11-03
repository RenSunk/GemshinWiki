import { useState } from 'react'
import { NIVELES, NOMBRES_TALENTOS, nivelesDisponibles, repartirInventario, sumarTotales } from '../utils/calculos.js'
import { claveDe, tipoDe } from '../hooks/usePlanificador.js'
import { usePlanCalculado } from '../hooks/usePlanCalculado.js'
import ListaMateriales from './ListaMateriales.jsx'
import Respaldo from './Respaldo.jsx'

const NIVELES_TALENTO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const VISTAS = { separado: 'Por separado', total: 'Todo junto' }

export default function Planificador({ personajes, armas, planificador, claveInicial = null }) {
  const { agregar, quitar, actualizar, mover, inventario, cambiarInventario, vaciarInventario, alquimia, setAlquimia } =
    planificador
  const [seleccion, setSeleccion] = useState('')
  const [abierto, setAbierto] = useState(claveInicial)
  const [vista, setVista] = useState('separado')
  const [ocultarCompletos, setOcultarCompletos] = useState(false)

  const { catalogo, entidadDe, planes, necesidades, repartos } = usePlanCalculado(personajes, armas, planificador)
  const enPlan = new Set(planes.map(claveDe))

  // Si no hay ninguno abierto (o se quitó), se muestra el último añadido
  const indiceAbierto = enPlan.has(abierto) ? planes.findIndex((p) => claveDe(p) === abierto) : planes.length - 1
  const planAbierto = planes[indiceAbierto]

  const alAgregar = (e) => {
    e.preventDefault()
    if (seleccion) {
      const [tipo, slug] = seleccion.split('/')
      agregar(tipo, catalogo[tipo].get(slug))
      setAbierto(seleccion)
      setVista('separado')
    }
    setSeleccion('')
  }

  const alVaciar = () => {
    if (window.confirm('¿Borrar todas las cantidades de tu inventario?')) vaciarInventario()
  }

  const propsLista = { inventario, onCambiarInventario: cambiarInventario, ocultarCompletos }

  return (
    <section className="planificador">
      <h1 className="titulo-pagina">Planificador de materiales</h1>
      <p className="nota">
        Elige el nivel actual y el objetivo de cada personaje o arma, y escribe en «Tengo» cuánto tienes de cada
        material. El plan se guarda en este navegador.
      </p>

      <form className="agregar-personaje" onSubmit={alAgregar}>
        <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
          <option value="">Elige un personaje o arma…</option>
          <optgroup label="Personajes">
            {personajes
              .filter((p) => !enPlan.has(`personaje/${p.slug}`))
              .map((p) => (
                <option key={p.slug} value={`personaje/${p.slug}`}>
                  {p.nombre}
                </option>
              ))}
          </optgroup>
          <optgroup label="Armas">
            {armas
              .filter((a) => !enPlan.has(`arma/${a.slug}`))
              .map((a) => (
                <option key={a.slug} value={`arma/${a.slug}`}>
                  {a.nombre} ({a.rareza}★ · {a.tipo})
                </option>
              ))}
          </optgroup>
        </select>
        <button type="submit" className="boton-principal" disabled={!seleccion}>
          Añadir
        </button>
      </form>

      {planes.length === 0 ? (
        <p className="vacio">
          Todavía no hay nada en el plan. Añade algo arriba o desde la página de un{' '}
          <a href="#/">personaje</a> o un <a href="#/armas">arma</a>.
        </p>
      ) : (
        <>
          <div className="barra-planificador">
            <div className="pestanas-vista" role="tablist">
              {Object.entries(VISTAS).map(([clave, nombre]) => (
                <button
                  key={clave}
                  role="tab"
                  aria-selected={vista === clave}
                  className={vista === clave ? 'activa' : ''}
                  onClick={() => setVista(clave)}
                >
                  {nombre}
                </button>
              ))}
            </div>
            <label>
              <input type="checkbox" checked={ocultarCompletos} onChange={(e) => setOcultarCompletos(e.target.checked)} />
              Ocultar completos
            </label>
            <label title="Si te faltan materiales de nivel alto, se fabrican con 3 del nivel inferior que te sobren">
              <input type="checkbox" checked={alquimia} onChange={(e) => setAlquimia(e.target.checked)} />
              Usar alquimia
            </label>
            <button className="boton-enlace" onClick={alVaciar} disabled={!Object.keys(inventario).length}>
              Vaciar inventario
            </button>
          </div>

          {vista === 'separado' ? (
            <>
              <div className="selector-plan" role="tablist" aria-label="Personajes y armas del plan">
                {planes.map((plan, i) => {
                  const entidad = entidadDe(plan)
                  const { porcentaje } = contarProgreso(repartos[i])
                  return (
                    <button
                      key={claveDe(plan)}
                      role="tab"
                      aria-selected={i === indiceAbierto}
                      className={`chip-plan ${i === indiceAbierto ? 'abierto' : ''}`}
                      onClick={() => setAbierto(claveDe(plan))}
                    >
                      <span className="chip-plan-orden">{i + 1}</span>
                      {tipoDe(plan) === 'arma' && <span className="chip-plan-tipo">Arma</span>}
                      <img src={entidad.icono} alt="" className={`rareza-${entidad.rareza}`} />
                      <span className="chip-plan-nombre">{entidad.nombre}</span>
                      <span className="progreso progreso-mini">
                        <span style={{ width: `${porcentaje}%` }} />
                      </span>
                    </button>
                  )
                })}
              </div>
              {planes.length > 1 && (
                <p className="nota">
                  «Tengo» es tu inventario total. Si varios usan el mismo material, se reparte en el orden de la lista
                  (el número de cada uno): usa ← → en su panel para cambiar quién va primero.
                </p>
              )}
              <TarjetaPlan
                key={claveDe(planAbierto)}
                entidad={entidadDe(planAbierto)}
                plan={planAbierto}
                posicion={indiceAbierto + 1}
                total={planes.length}
                onCambiar={(cambios) => actualizar(claveDe(planAbierto), cambios)}
                onQuitar={() => quitar(claveDe(planAbierto))}
                onMover={(direccion) => mover(claveDe(planAbierto), direccion)}
              >
                <Progreso reparto={repartos[indiceAbierto]} />
                <ListaMateriales
                  totales={repartos[indiceAbierto].necesita}
                  cubiertos={repartos[indiceAbierto].cubiertos}
                  fabricados={repartos[indiceAbierto].fabricados}
                  {...propsLista}
                />
              </TarjetaPlan>
            </>
          ) : (
            <div className="tarjeta-plan">
              <p className="nota">Suma de los materiales de todo lo que hay en el plan.</p>
              <TodoJunto necesidades={necesidades} alquimia={alquimia} propsLista={propsLista} />
            </div>
          )}
        </>
      )}

      <Respaldo planificador={planificador} />
    </section>
  )
}

function TodoJunto({ necesidades, alquimia, propsLista }) {
  const [reparto] = repartirInventario([sumarTotales(necesidades)], propsLista.inventario, { alquimia })
  return (
    <>
      <Progreso reparto={reparto} />
      <ListaMateriales
        totales={reparto.necesita}
        cubiertos={reparto.cubiertos}
        fabricados={reparto.fabricados}
        {...propsLista}
      />
    </>
  )
}

function contarProgreso({ necesita, cubiertos }) {
  const completos = [...necesita].filter(([id, cantidad]) => cubiertos.get(id) >= cantidad).length
  const porcentaje = necesita.size ? Math.round((completos / necesita.size) * 100) : 100
  return { completos, porcentaje }
}

function Progreso({ reparto }) {
  const { completos, porcentaje } = contarProgreso(reparto)

  return (
    <div className="progreso-bloque">
      <span>
        {completos} de {reparto.necesita.size} materiales completos
        {reparto.moraAlquimia > 0 && ` · la mora incluye ${reparto.moraAlquimia.toLocaleString('es')} de alquimia`}
      </span>
      <div className="progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin="0" aria-valuemax="100">
        <div style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

function TarjetaPlan({ entidad, plan, posicion, total, onCambiar, onQuitar, onMover, children }) {
  const esArma = tipoDe(plan) === 'arma'
  const sinTalentos = !esArma && entidad.costesTalento.length === 0
  const niveles = nivelesDisponibles(entidad)

  // Si el actual supera al objetivo, el objetivo sube con él (y al revés)
  const cambiarNivel = (campo, valor) => {
    const cambios = { [campo]: valor }
    if (campo === 'nivelActual' && valor > plan.nivelObjetivo) cambios.nivelObjetivo = valor
    if (campo === 'nivelObjetivo' && valor < plan.nivelActual) cambios.nivelActual = valor
    onCambiar(cambios)
  }

  const cambiarTalento = (indice, posicion, valor) => {
    const talentos = plan.talentos.map((t) => [...t])
    talentos[indice][posicion] = valor
    if (talentos[indice][0] > talentos[indice][1]) talentos[indice][1 - posicion] = valor
    onCambiar({ talentos })
  }

  return (
    <article className="tarjeta-plan">
      <header>
        <img src={entidad.icono} alt="" className={`rareza-${entidad.rareza}`} />
        <a href={esArma ? `#/arma/${entidad.slug}` : `#/personaje/${entidad.slug}`}>{entidad.nombre}</a>
        {total > 1 && (
          <>
            <span className="prioridad">
              Prioridad {posicion} de {total}
            </span>
            <button className="boton-icono" onClick={() => onMover(-1)} disabled={posicion === 1} aria-label="Subir prioridad">
              ←
            </button>
            <button className="boton-icono" onClick={() => onMover(1)} disabled={posicion === total} aria-label="Bajar prioridad">
              →
            </button>
          </>
        )}
        <button className="boton-icono boton-quitar" onClick={onQuitar} aria-label={`Quitar ${entidad.nombre}`}>
          ✕
        </button>
      </header>

      <div className="tarjeta-plan-cuerpo">
        <div className="tarjeta-plan-niveles">
          <div className="fila-plan">
            <span>Nivel</span>
            <Rango
              opciones={niveles.map((n) => [NIVELES.indexOf(n), n.etiqueta])}
              desde={plan.nivelActual}
              hasta={plan.nivelObjetivo}
              onDesde={(v) => cambiarNivel('nivelActual', v)}
              onHasta={(v) => cambiarNivel('nivelObjetivo', v)}
            />
          </div>

          {esArma && (
            <p className="nota">
              {entidad.rareza}★ · {entidad.tipo}
            </p>
          )}
          {sinTalentos && <p className="nota">Los talentos de este personaje no están disponibles en los datos.</p>}
          {!esArma &&
            !sinTalentos &&
            NOMBRES_TALENTOS.map((nombre, i) => (
              <div className="fila-plan" key={nombre}>
                <span>{nombre}</span>
                <Rango
                  opciones={NIVELES_TALENTO.map((n) => [n, n])}
                  desde={plan.talentos[i][0]}
                  hasta={plan.talentos[i][1]}
                  onDesde={(v) => cambiarTalento(i, 0, v)}
                  onHasta={(v) => cambiarTalento(i, 1, v)}
                />
              </div>
            ))}
        </div>

        <div className="tarjeta-plan-materiales">{children}</div>
      </div>
    </article>
  )
}

function Rango({ opciones, desde, hasta, onDesde, onHasta }) {
  const select = (valor, alCambiar) => (
    <select value={valor} onChange={(e) => alCambiar(Number(e.target.value))}>
      {opciones.map(([v, etiqueta]) => (
        <option key={v} value={v}>
          {etiqueta}
        </option>
      ))}
    </select>
  )
  return (
    <div className="rango">
      {select(desde, onDesde)}
      <span>→</span>
      {select(hasta, onHasta)}
    </div>
  )
}
