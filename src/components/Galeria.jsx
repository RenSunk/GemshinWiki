import { useMemo, useState } from 'react'
import { ARMAS, ELEMENTOS, REGIONES, COLORES_ELEMENTO } from '../utils/constantes.js'
import TarjetaPersonaje from './TarjetaPersonaje.jsx'

// Quita tildes para que "citlali" encuentre a "Citlalí"
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Galeria({ personajes }) {
  const [busqueda, setBusqueda] = useState('')
  const [elemento, setElemento] = useState('')
  const [arma, setArma] = useState('')
  const [region, setRegion] = useState('')
  const [rareza, setRareza] = useState('')

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return personajes.filter(
      (p) =>
        (!texto || normalizar(p.nombre).includes(texto)) &&
        (!elemento || p.elemento === elemento) &&
        (!arma || p.arma === arma) &&
        (!region || p.region === region) &&
        (!rareza || p.rareza === Number(rareza)),
    )
  }, [personajes, busqueda, elemento, arma, region, rareza])

  const limpiar = () => {
    setBusqueda('')
    setElemento('')
    setArma('')
    setRegion('')
    setRareza('')
  }

  return (
    <section>
      <div className="filtros">
        <input
          type="search"
          className="buscador"
          placeholder="Buscar personaje…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="filtro-elementos">
          {ELEMENTOS.map((el) => (
            <button
              key={el}
              className={`chip ${elemento === el ? 'activo' : ''}`}
              style={{ '--color': COLORES_ELEMENTO[el] }}
              onClick={() => setElemento(elemento === el ? '' : el)}
            >
              {el}
            </button>
          ))}
        </div>

        <div className="filtro-selects">
          <select value={arma} onChange={(e) => setArma(e.target.value)}>
            <option value="">Todas las armas</option>
            {ARMAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Todas las regiones</option>
            {REGIONES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={rareza} onChange={(e) => setRareza(e.target.value)}>
            <option value="">Todas las rarezas</option>
            <option value="5">5 ★</option>
            <option value="4">4 ★</option>
          </select>
          <button className="boton-limpiar" onClick={limpiar}>
            Limpiar
          </button>
        </div>
      </div>

      <p className="contador">{filtrados.length} resultados</p>

      {filtrados.length ? (
        <div className="galeria">
          {filtrados.map((p) => (
            <TarjetaPersonaje key={p.id} personaje={p} />
          ))}
        </div>
      ) : (
        <p className="vacio">Ningún personaje coincide con esos filtros.</p>
      )}
    </section>
  )
}
