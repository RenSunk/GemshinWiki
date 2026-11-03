// Función de servidor (Vercel): consulta la vitrina de un jugador en Enka.Network.
// El navegador no puede llamar a Enka directamente (su API no permite CORS), así que pasa por aquí.
// Uso: GET /api/enka?uid=618285856
// Devuelve solo lo que usa la web y respeta el tiempo de caché (ttl) que indica Enka.
// Escrita con la API básica de Node (sin res.json de Vercel) para reutilizarla en `vite dev` y `vite preview`.

const ENKA = 'https://enka.network/api/uid'
// Enka pide identificar las aplicaciones que usan su API
const USER_AGENT = 'GenshinWiki/1.0 (+https://genshin-wiki.vercel.app)'

const MENSAJES = {
  400: 'Ese UID no es válido.',
  404: 'No existe ningún jugador con ese UID.',
  424: 'El juego está en mantenimiento o Enka.Network no puede consultarlo ahora. Prueba más tarde.',
  429: 'Demasiadas consultas seguidas. Espera un minuto y vuelve a intentarlo.',
  500: 'Enka.Network tuvo un error. Prueba más tarde.',
  503: 'Enka.Network no está disponible ahora mismo. Prueba más tarde.',
}

function responder(res, estado, datos, segundosCache = 0) {
  res.statusCode = estado
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', segundosCache ? `public, max-age=${segundosCache}, s-maxage=${segundosCache}` : 'no-store')
  res.end(JSON.stringify(datos))
}

const numero = (propMap, clave) => Number(propMap?.[clave]?.val ?? 0)

// Solo los campos que muestra la web
function resumir(datos) {
  const p = datos.playerInfo ?? {}
  return {
    uid: datos.uid,
    ttl: datos.ttl,
    jugador: {
      nombre: p.nickname ?? '',
      nivel: p.level ?? 0,
      nivelMundo: p.worldLevel ?? 0,
      firma: p.signature ?? '',
      logros: p.finishAchievementNum ?? 0,
      abismo: p.towerFloorIndex ? `${p.towerFloorIndex}-${p.towerLevelIndex}` : null,
      avatarId: p.profilePicture?.avatarId ?? null,
    },
    // Vitrina: siempre trae id y nivel; los detalles solo si el jugador los muestra en su perfil
    vitrina: (p.showAvatarInfoList ?? []).map((a) => ({ avatarId: a.avatarId, nivel: a.level })),
    detalles: (datos.avatarInfoList ?? []).map((a) => {
      const arma = a.equipList?.find((e) => e.weapon)
      return {
        avatarId: a.avatarId,
        nivel: numero(a.propMap, '4001'),
        fase: numero(a.propMap, '1002'),
        constelaciones: a.talentIdList?.length ?? 0,
        talentos: a.skillLevelMap ?? {},
        arma: arma && {
          id: arma.itemId,
          nivel: arma.weapon.level ?? 1,
          fase: arma.weapon.promoteLevel ?? 0,
          refinamiento: Object.values(arma.weapon.affixMap ?? {})[0] + 1 || 1,
        },
      }
    }),
  }
}

export default async function handler(req, res) {
  const uid = new URL(req.url, 'http://localhost').searchParams.get('uid') ?? ''
  if (!/^\d{9,10}$/.test(uid)) return responder(res, 400, { error: MENSAJES[400] })

  let respuesta
  try {
    respuesta = await fetch(`${ENKA}/${uid}/`, { headers: { 'User-Agent': USER_AGENT } })
  } catch {
    return responder(res, 503, { error: MENSAJES[503] })
  }

  if (!respuesta.ok) {
    return responder(res, respuesta.status, { error: MENSAJES[respuesta.status] ?? MENSAJES[500] })
  }

  const datos = await respuesta.json()
  return responder(res, 200, resumir(datos), Math.max(0, Math.min(datos.ttl ?? 60, 300)))
}
