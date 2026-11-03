// Tarjeta de la galería: icono sobre fondo de rareza y nombre. `color` pinta el punto del elemento.
export default function Tarjeta({ href, nombre, icono, rareza, color, titulo }) {
  return (
    <a href={href} className="tarjeta">
      <div className={`tarjeta-imagen rareza-${rareza}`}>
        <img src={icono} alt={nombre} loading="lazy" />
        {color && <span className="tarjeta-elemento" style={{ background: color }} title={titulo} />}
      </div>
      <div className="tarjeta-nombre">{nombre}</div>
    </a>
  )
}
