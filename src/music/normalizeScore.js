// src/music/normalizeScore.js
import { DEFAULT_TPQ, ticksPerMeasure } from './timebase'

function parseTimeSignature(doc) {
  const ts = doc.time_signature ?? doc.timeSignature

  // Votre format réel: [4,4]
  if (Array.isArray(ts) && ts.length >= 2) {
    return { num: Number(ts[0]) || 4, den: Number(ts[1]) || 4 }
  }

  // Fallback: { num, den }
  if (ts && typeof ts === 'object') {
    return { num: Number(ts.num) || 4, den: Number(ts.den) || 4 }
  }

  return { num: 4, den: 4 }
}

export function normalizeScore(doc) {
  if (!doc) return null

  const tpq = Number(doc.ppq) || DEFAULT_TPQ
  const timeSignature = parseTimeSignature(doc)
  const tpm = ticksPerMeasure(tpq, timeSignature)

  const rawNotes = doc.tracks?.[0]?.notes ?? []

  // Dans votre doc: start et duration sont déjà en ticks
  const events = rawNotes
    .filter((n) => typeof n?.start === 'number' && typeof n?.duration === 'number')
    .map((n, idx) => {
      const startTick = Math.round(n.start)
      const durTicks = Math.max(1, Math.round(n.duration))

      return {
        id: n?.id ?? n?._id ?? `${idx}`,
        startTick,
        durTicks,
        tickInMeasure: startTick % tpm,
        pitch: n?.pitch ?? null,
        string: n?.string ?? null,
        fret: n?.fret ?? null,
        _raw: n,
      }
    })

  // Regroupement par mesure (index absolu)
  const measuresMap = new Map()
  for (const ev of events) {
    const absIndex = Math.floor(ev.startTick / tpm)
    const arr = measuresMap.get(absIndex) ?? []
    arr.push(ev)
    measuresMap.set(absIndex, arr)
  }

  if (measuresMap.size === 0) {
    return {
      __normalizeVersion: 'v2',
      tpq,
      timeSignature,
      ticksPerMeasure: tpm,
      measureStartIndex: 0,
      measures: [],
    }
  }

  // Rebase: on commence à la première mesure réellement utilisée
  const absIndexes = Array.from(measuresMap.keys()).sort((a, b) => a - b)
  const minAbs = absIndexes[0]
  const maxAbs = absIndexes[absIndexes.length - 1]

  const measures = []
  for (let abs = minAbs; abs <= maxAbs; abs++) {
    measures.push({
      index: abs - minAbs, // index relatif (0..N) pour l’affichage
      absIndex: abs,       // index absolu (source)
      events: (measuresMap.get(abs) ?? []).sort((a, b) => a.startTick - b.startTick),
    })
  }

  return {
    __normalizeVersion: 'v2',
    tpq,
    timeSignature,
    ticksPerMeasure: tpm,
    measureStartIndex: minAbs,
    measures,
  }
}
