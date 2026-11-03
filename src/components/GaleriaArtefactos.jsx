import { useMemo, useState } from 'react'
import { normalizar } from '../utils/constantes.js'
import Tarjeta from './Tarjeta.jsx'

export default function GaleriaArtefactos({ artefactos }) {
  const [busqueda, setBusqueda] = useState('')
  const [rareza, setRareza] = useState('')

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    // Busca también en los bonos: "pyro" o "escudo" encuentran los sets que los mencionan
    return artefactos.filter(
      (a) =>
        (!texto || normalizar([a.nombre, ...a.bonos.map((b) => b.texto)].join(' ')).includes(texto)) &&
        (!rareza || a.rarezas[1] === Number(rareza)),
    )
  }, [artefactos, busqueda, rareza])

  return (
    <section>
      <div className="filtros">
        <input
          type="search"
          className="buscador"
          placeholder="Buscar set o bono (p. ej. «Pyro», «escudo», «Recarga»)…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="filtro-selects">
          <select value={rareza} onChange={(e) => setRareza(e.target.value)}>
            <option value="">Todas las rarezas máximas</option>
            {[5, 4, 3].map((r) => (
              <option key={r} value={r}>
                Hasta {r} ★
              </option>
            ))}
          </select>
          <button
            className="boton-limpiar"
            onClick={() => {
              setBusqueda('')
              setRareza('')
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      <p className="contador">{filtrados.length} sets</p>

      {filtrados.length ? (
        <div className="galeria">
          {filtrados.map((a) => (
            <Tarjeta
              key={a.id}
              href={`#/artefacto/${a.slug}`}
              nombre={a.nombre}
              icono={a.icono}
              rareza={a.rarezas[1]}
            />
          ))}
        </div>
      ) : (
        <p className="vacio">Ningún set coincide con esa búsqueda.</p>
      )}
    </section>
  )
}
