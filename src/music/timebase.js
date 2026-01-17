// src/music/timebase.js
export const DEFAULT_TPQ = 960

export function ticksPerMeasure(tpq, ts) {
  return Math.round(tpq * ts.num * (4 / ts.den))
}

// Accepte plusieurs formats de "base":
// - 'w','h','q','8','16','32','64'
// - 1,2,4,8,16... (ou strings "8", "16"...)
export function baseDurationTicks(tpq, base) {
  if (base == null) return null

  // Numérique / string num
  const asNum = typeof base === 'number' ? base : (typeof base === 'string' && /^\d+$/.test(base) ? Number(base) : null)
  if (asNum != null) {
    // 1=whole, 2=half, 4=quarter, 8=eighth...
    return Math.round(tpq * (4 / asNum))
  }

  switch (base) {
    case 'w':  return tpq * 4
    case 'h':  return tpq * 2
    case 'q':  return tpq
    case '8':  return tpq / 2
    case '16': return tpq / 4
    case '32': return tpq / 8
    case '64': return tpq / 16
    default:
      return null
  }
}

export function applyDots(ticks, dots = 0) {
  if (ticks == null) return null
  let out = ticks
  let add = ticks / 2
  for (let i = 0; i < dots; i++) {
    out += add
    add /= 2
  }
  return Math.round(out)
}

export function applyTuplet(ticks, tuplet) {
  if (ticks == null) return null
  if (!tuplet) return Math.round(ticks)
  return Math.round(ticks * (tuplet.normal / tuplet.actual))
}
