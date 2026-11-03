import { useMemo, useState } from 'react'
import { ARMAS, normalizar } from '../utils/constantes.js'
import Tarjeta from './Tarjeta.jsx'

const COLOR_TIPO = '#d3bc8e'

export default function GaleriaArmas({ armas }) {
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const [rareza, setRareza] = useState('')

  const filtradas = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return armas.filter(
      (a) =>
        (!texto || normalizar(a.nombre).includes(texto)) &&
        (!tipo || a.tipo === tipo) &&
        (!rareza || a.rareza === Number(rareza)),
    )
  }, [armas, busqueda, tipo, rareza])

  const limpiar = () => {
    setBusqueda('')
    setTipo('')
    setRareza('')
  }

  return (
    <section>
      <div className="filtros">
        <input
          type="search"
          className="buscador"
          placeholder="Buscar arma…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="filtro-elementos">
          {ARMAS.map((t) => (
            <button
              key={t}
              className={`chip ${tipo === t ? 'activo' : ''}`}
              style={{ '--color': COLOR_TIPO }}
              onClick={() => setTipo(tipo === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="filtro-selects">
          <select value={rareza} onChange={(e) => setRareza(e.target.value)}>
            <option value="">Todas las rarezas</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} ★
              </option>
            ))}
          </select>
          <button className="boton-limpiar" onClick={limpiar}>
            Limpiar
          </button>
        </div>
      </div>

      <p className="contador">{filtradas.length} resultados</p>

      {filtradas.length ? (
        <div className="galeria">
          {filtradas.map((a) => (
            <Tarjeta key={a.id} href={`#/arma/${a.slug}`} nombre={a.nombre} icono={a.icono} rareza={a.rareza} />
          ))}
        </div>
      ) : (
        <p className="vacio">Ningún arma coincide con esos filtros.</p>
      )}
    </section>
  )
}
