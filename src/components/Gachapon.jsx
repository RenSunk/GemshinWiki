import { useMemo, useState } from 'react'
import { useAlmacenado } from '../hooks/useAlmacenado.js'
import { formatearNumero } from '../utils/constantes.js'
import {
  GONDOLEROS,
  PROTOGEMAS_POR_TIRADA,
  estadoInicial,
  probabilidadCopias,
  tiradasNecesarias,
  tirar,
} from '../utils/gacha.js'

const PESTANAS = { simulador: 'Simulador', calculadora: 'Calculadora' }

export default function Gachapon({ personajes, armas }) {
  const [pestana, setPestana] = useState('simulador')
  const [tipo, setTipo] = useState('personaje')

  // Candidatos a destacado: 5★ jugables (sin Viajeros ni Manekines) y armas 5★
  const destacables = useMemo(
    () => ({
      personaje: personajes.filter((p) => p.rareza === 5 && p.elemento !== 'Variable'),
      arma: armas.filter((a) => a.rareza === 5),
    }),
    [personajes, armas],
  )

  return (
    <section className="gachapon">
      <h1 className="titulo-pagina">Simulador de gachapón</h1>
      <p className="nota">
        Tiradas con las probabilidades oficiales, pity y 50/50, y una calculadora de cuántas tiradas necesitas. Es una
        simulación: no gasta nada de tu cuenta.
      </p>

      <div className="barra-planificador">
        <div className="pestanas-vista" role="tablist">
          {Object.entries(PESTANAS).map(([clave, nombre]) => (
            <button
              key={clave}
              role="tab"
              aria-selected={pestana === clave}
              className={pestana === clave ? 'activa' : ''}
              onClick={() => setPestana(clave)}
            >
              {nombre}
            </button>
          ))}
        </div>
        <div className="pestanas-vista" role="tablist" aria-label="Gondolero">
          {Object.entries(GONDOLEROS).map(([clave, g]) => (
            <button
              key={clave}
              role="tab"
              aria-selected={tipo === clave}
              className={tipo === clave ? 'activa' : ''}
              onClick={() => setTipo(clave)}
            >
              {g.nombre}
            </button>
          ))}
        </div>
      </div>

      {pestana === 'simulador' ? (
        <Simulador key={tipo} tipo={tipo} destacables={destacables[tipo]} />
      ) : (
        <Calculadora key={tipo} tipo={tipo} />
      )}

      <p className="nota nota-pie">
        Probabilidades oficiales: personaje 5★ 0,6% (1,6% contando el pity, seguro a las 90) y 4★ 5,1% (13%, seguro a
        las 10); arma 5★ 0,7% (1,85%, seguro a las 80) y 4★ 6% (14,5%). La subida de probabilidad en las últimas
        tiradas («pity suave») no es oficial: aquí está ajustada para dar esos totales. No se simula la «Captura
        radiante» (desde la versión 5.0), que da algo de ventaja al 50/50 y cuyas probabilidades no son públicas.
      </p>
    </section>
  )
}

// ---------- Simulador ----------

const sesionNueva = (destacado) => ({ estado: estadoInicial(), tiradas: 0, historial: [], ultimas: [], destacado })

function Simulador({ tipo, destacables }) {
  const g = GONDOLEROS[tipo]
  const [sesiones, setSesiones] = useAlmacenado('genshin-wiki:gachapon', {})
  // Si el destacado guardado ya no existe en los datos, se usa el primero de la lista
  const guardada = sesiones[tipo]
  const sesion = guardada && destacables.some((d) => d.slug === guardada.destacado) ? guardada : sesionNueva(destacables[0].slug)
  const destacado = destacables.find((d) => d.slug === sesion.destacado)

  const guardar = (nueva) => setSesiones({ ...sesiones, [tipo]: nueva })

  const tirarVeces = (veces) => {
    let estado = sesion.estado
    const resultados = []
    for (let i = 0; i < veces; i++) {
      const r = tirar(tipo, estado)
      estado = r.estado
      resultados.push(r.resultado)
    }
    const cincos = resultados
      .map((r, i) => ({ ...r, numero: sesion.tiradas + i + 1 }))
      .filter((r) => r.estrellas === 5)
    guardar({
      ...sesion,
      estado,
      tiradas: sesion.tiradas + veces,
      ultimas: resultados,
      historial: [...cincos.reverse(), ...sesion.historial].slice(0, 100),
    })
  }

  const cambiarDestacado = (slug) => guardar({ ...sesion, destacado: slug })
  const reiniciar = () => {
    if (window.confirm('¿Empezar de cero? Se borran el pity y el historial de este gondolero.')) guardar(sesionNueva(sesion.destacado))
  }

  const cuenta = (filtro) => sesion.historial.filter(filtro).length
  const destacados = cuenta((r) => r.tipo === 'destacado')
  const { estado } = sesion

  return (
    <div className="simulador">
      <div className="simulador-cabecera">
        <label className="campo">
          <span>{tipo === 'personaje' ? 'Personaje destacado' : 'Arma elegida (Camino de la Epitomización)'}</span>
          <select value={sesion.destacado} onChange={(e) => cambiarDestacado(e.target.value)}>
            {destacables.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="simulador-botones">
          <button className="boton-principal" onClick={() => tirarVeces(1)}>
            Tirar ×1 <small>{PROTOGEMAS_POR_TIRADA}</small>
          </button>
          <button className="boton-principal" onClick={() => tirarVeces(10)}>
            Tirar ×10 <small>{formatearNumero(PROTOGEMAS_POR_TIRADA * 10)}</small>
          </button>
          <button className="boton-enlace" onClick={reiniciar} disabled={!sesion.tiradas}>
            Empezar de cero
          </button>
        </div>
      </div>

      {sesion.ultimas.length > 0 && (
        <div className="tiradas" aria-live="polite">
          {sesion.ultimas.map((r, i) => (
            <ResultadoTirada key={`${sesion.tiradas}-${i}`} resultado={r} destacado={destacado} tipo={tipo} indice={i} />
          ))}
        </div>
      )}

      <dl className="estadisticas">
        <Estadistica etiqueta="Tiradas" valor={formatearNumero(sesion.tiradas)} />
        <Estadistica etiqueta="Protogemas" valor={formatearNumero(sesion.tiradas * PROTOGEMAS_POR_TIRADA)} />
        <Estadistica etiqueta="Pity 5★" valor={`${estado.pity5} / ${g.maximo5}`} />
        <Estadistica etiqueta="Pity 4★" valor={`${estado.pity4} / ${g.maximo4}`} />
        {tipo === 'personaje' ? (
          <Estadistica etiqueta="Próximo 5★" valor={estado.garantizado5 ? 'Destacado seguro' : '50/50'} />
        ) : (
          <Estadistica etiqueta="Puntos de destino" valor={`${estado.puntosDestino} / 1`} />
        )}
        <Estadistica etiqueta={`${tipo === 'personaje' ? 'Destacados' : 'Elegidas'} conseguidos`} valor={destacados} />
        <Estadistica
          etiqueta="Promedio por destacado"
          valor={destacados ? formatearNumero(Math.round(sesion.tiradas / destacados)) : '—'}
        />
      </dl>

      {sesion.historial.length > 0 && (
        <>
          <h2 className="hoy-subtitulo">Historial de 5★</h2>
          <ul className="historial">
            {sesion.historial.map((r) => (
              <li key={r.numero} className={`historial-${r.tipo}`}>
                <span>Tirada {formatearNumero(r.numero)}</span>
                <strong>{nombreResultado(r, destacado, tipo)}</strong>
                <span>pity {r.pity}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function nombreResultado(r, destacado, tipo) {
  if (r.estrellas === 5) {
    if (r.tipo === 'destacado') return destacado.nombre
    if (r.tipo === 'otro-destacado') return 'La otra arma destacada'
    return tipo === 'personaje' ? '5★ estándar (perdiste el 50/50)' : 'Arma 5★ estándar'
  }
  if (r.estrellas === 4) return r.tipo === 'destacado' ? '4★ destacado' : '4★'
  return 'Arma 3★'
}

function ResultadoTirada({ resultado: r, destacado, tipo, indice }) {
  const conImagen = r.estrellas === 5 && r.tipo === 'destacado'
  return (
    <div className={`tirada tirada-${r.estrellas}`} style={{ animationDelay: `${indice * 60}ms` }}>
      {conImagen ? <img src={destacado.icono} alt="" /> : <span className="tirada-estrellas">{'★'.repeat(r.estrellas)}</span>}
      <small>{nombreResultado(r, destacado, tipo)}</small>
    </div>
  )
}

function Estadistica({ etiqueta, valor }) {
  return (
    <div>
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  )
}

// ---------- Calculadora ----------

function Calculadora({ tipo }) {
  const g = GONDOLEROS[tipo]
  const esArma = tipo === 'arma'
  const [protogemas, setProtogemas] = useState(0)
  const [destinos, setDestinos] = useState(0)
  const [pity, setPity] = useState(0)
  const [garantizado, setGarantizado] = useState(false)
  const [copias, setCopias] = useState(1)

  const tiradas = Math.floor(protogemas / PROTOGEMAS_POR_TIRADA) + destinos

  // El cálculo exacto es rápido (< 0,1 s), pero se memoriza para no repetirlo en cada render
  const resultado = useMemo(() => {
    const opciones = { pity, garantizado: !esArma && garantizado, puntosDestino: esArma && garantizado ? 1 : 0, copias }
    return {
      alMenos: tiradas > 0 ? probabilidadCopias(tipo, { tiradas, ...opciones }) : new Array(copias).fill(0),
      necesarias: tiradasNecesarias(tipo, opciones),
    }
  }, [tipo, esArma, tiradas, pity, garantizado, copias])

  const numero = (valor, maximo) => Math.max(0, Math.min(maximo, Math.floor(Number(valor) || 0)))
  const etiquetaCopia = (i) => (esArma ? `R${i + 1}` : `C${i}`)
  const porcentaje = (p) => (p >= 0.9999 ? '100%' : p < 0.0001 ? '0%' : `${(p * 100).toFixed(p < 0.1 ? 2 : 1).replace('.', ',')}%`)

  return (
    <div className="calculadora">
      <div className="campos">
        <label className="campo">
          <span>Protogemas</span>
          <input type="number" min="0" inputMode="numeric" value={protogemas || ''} placeholder="0" onChange={(e) => setProtogemas(numero(e.target.value, 1e8))} />
        </label>
        <label className="campo">
          <span>Destinos entrelazados</span>
          <input type="number" min="0" inputMode="numeric" value={destinos || ''} placeholder="0" onChange={(e) => setDestinos(numero(e.target.value, 1e5))} />
        </label>
        <label className="campo">
          <span>Pity actual (tiradas sin 5★)</span>
          <input type="number" min="0" max={g.maximo5 - 1} inputMode="numeric" value={pity || ''} placeholder="0" onChange={(e) => setPity(numero(e.target.value, g.maximo5 - 1))} />
        </label>
        <label className="campo">
          <span>Objetivo</span>
          <select value={copias} onChange={(e) => setCopias(Number(e.target.value))}>
            {Array.from({ length: esArma ? 5 : 7 }, (_, i) => (
              <option key={i} value={i + 1}>
                {esArma ? `R${i + 1} (${i + 1} ${i ? 'copias' : 'copia'})` : `C${i} (${i + 1} ${i ? 'copias' : 'copia'})`}
              </option>
            ))}
          </select>
        </label>
        <label className="campo campo-casilla">
          <input type="checkbox" checked={garantizado} onChange={(e) => setGarantizado(e.target.checked)} />
          <span>
            {esArma
              ? 'Tengo 1 punto de destino (el próximo 5★ es el arma elegida)'
              : 'El próximo 5★ es seguro el destacado (perdí el último 50/50)'}
          </span>
        </label>
      </div>

      <div className="calculadora-resultado">
        <p className="calculadora-tiradas">
          <strong>{formatearNumero(tiradas)}</strong> tiradas
          {tiradas > 0 && <small> ({formatearNumero(tiradas * PROTOGEMAS_POR_TIRADA)} protogemas en total)</small>}
        </p>
        <ul className="probabilidades">
          {resultado.alMenos.map((p, i) => (
            <li key={i}>
              <span>{etiquetaCopia(i)}</span>
              <div className="progreso">
                <div style={{ width: `${p * 100}%` }} />
              </div>
              <strong>{porcentaje(p)}</strong>
            </li>
          ))}
        </ul>
        <p className="nota">
          Para llegar a <strong>{etiquetaCopia(copias - 1)}</strong> necesitas{' '}
          <strong>{formatearNumero(resultado.necesarias[0.5])}</strong> tiradas para tener un 50% de probabilidad y{' '}
          <strong>{formatearNumero(resultado.necesarias[0.9])}</strong> para un 90%.
        </p>
      </div>
    </div>
  )
}
