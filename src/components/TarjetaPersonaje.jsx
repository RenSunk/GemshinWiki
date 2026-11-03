import { COLORES_ELEMENTO } from '../utils/constantes.js'

export default function TarjetaPersonaje({ personaje }) {
  const { slug, nombre, icono, rareza, elemento } = personaje

  return (
    <a href={`#/personaje/${slug}`} className="tarjeta">
      <div className={`tarjeta-imagen rareza-${rareza}`}>
        <img src={icono} alt={nombre} loading="lazy" />
        <span className="tarjeta-elemento" style={{ background: COLORES_ELEMENTO[elemento] }} title={elemento} />
      </div>
      <div className="tarjeta-nombre">{nombre}</div>
    </a>
  )
}
