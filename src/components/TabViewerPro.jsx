import { useMemo } from 'react'

// Accordage guitare standard (string 1..6): E4 B3 G3 D3 A2 E2
const STANDARD_TUNING = [64, 59, 55, 50, 45, 40]

function inferStringFret(pitch, tuning = STANDARD_TUNING, maxFret = 24) {
  let best = null
  for (let s = 0; s < tuning.length; s += 1) {
    const open = tuning[s]
    const fret = pitch - open
    if (fret < 0 || fret > maxFret) continue
    if (!best || fret < best.fret) best = { string: s + 1, fret }
  }
  return best
}

function normalizeNotes(notes, tuning) {
  return (Array.isArray(notes) ? notes : [])
    .map((n) => {
      const pitch = n.pitch
      if (typeof pitch !== 'number') return null

      const string = typeof n.string === 'number' && n.string > 0 ? n.string : null
      const fret = typeof n.fret === 'number' && n.fret >= 0 ? n.fret : null

      if (string && fret !== null) return { ...n, string, fret }

      const inf = inferStringFret(pitch, tuning)
      if (!inf) return null
      return { ...n, string: inf.string, fret: inf.fret }
    })
    .filter(Boolean)
}

// --- Durées → type de note (ronde/blanche/noire/croche/...) ---
function durationToNoteType(durationTicks, ppq) {
  const whole = 4 * ppq
  const half = 2 * ppq
  const quarter = ppq
  const eighth = ppq / 2
  const sixteenth = ppq / 4

  const near = (a, b) => Math.abs(a - b) <= Math.max(3, b * 0.12)

  if (near(durationTicks, whole)) return { name: 'whole', flags: 0, filled: false, stem: false }
  if (near(durationTicks, half)) return { name: 'half', flags: 0, filled: false, stem: true }
  if (near(durationTicks, quarter)) return { name: 'quarter', flags: 0, filled: true, stem: true }
  if (near(durationTicks, eighth)) return { name: 'eighth', flags: 1, filled: true, stem: true }
  if (near(durationTicks, sixteenth)) return { name: 'sixteenth', flags: 2, filled: true, stem: true }

  if (durationTicks >= half) return { name: 'half-ish', flags: 0, filled: false, stem: true }
  if (durationTicks >= quarter) return { name: 'quarter-ish', flags: 0, filled: true, stem: true }
  if (durationTicks >= eighth) return { name: 'eighth-ish', flags: 1, filled: true, stem: true }
  return { name: 'sixteenth-ish', flags: 2, filled: true, stem: true }
}

function groupNotesByStart(notes) {
  const map = new Map()
  for (const n of notes) {
    const k = n.start
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(n)
  }
  const starts = Array.from(map.keys()).sort((a, b) => a - b)
  return starts.map((s) => {
    const group = map.get(s)
    const maxDur = Math.max(...group.map((x) => x.duration || 0))
    return { start: s, duration: maxDur, notes: group }
  })
}

// Ajoute flags/noteType sur chaque groupe
function addRhythmInfo(groups, ppq) {
  return groups.map((g) => {
    const nt = durationToNoteType(g.duration || ppq, ppq)
    return { ...g, _noteType: nt, _flags: nt.flags || 0 }
  })
}

/**
 * Segments de beaming par beat (ne traverse pas un temps).
 * Beam uniquement si flags>=1 et >=2 notes consécutives.
 */
function computeBeamSegments(groupsWithFlags, ticksPerBeat) {
  const segments = []
  const byBeat = new Map()

  for (const g of groupsWithFlags) {
    const beatIndex = Math.floor(g.start / ticksPerBeat)
    const arr = byBeat.get(beatIndex) ?? []
    arr.push(g)
    byBeat.set(beatIndex, arr)
  }

  const beatKeys = Array.from(byBeat.keys()).sort((a, b) => a - b)
  for (const bk of beatKeys) {
    const arr = byBeat.get(bk).sort((a, b) => a.start - b.start)

    let run = []
    for (const g of arr) {
      if ((g._flags ?? 0) >= 1) {
        run.push(g)
      } else {
        if (run.length >= 2) segments.push(run)
        run = []
      }
    }
    if (run.length >= 2) segments.push(run)
  }

  return segments
}

export default function TabViewerPro({ model, doc }) {
  // PPQ
  const ppq = model?.tpq ?? doc?.ppq ?? 480

  // Time signature
  const ts = model?.timeSignature
  const docTimeSig = doc?.time_signature
  const [beats, beatType] = ts ? [ts.num, ts.den] : (docTimeSig || [4, 4])

  // ticks/measure
  const ticksPerBeat = ppq * (4 / beatType)
  const ticksPerMeasure = model?.ticksPerMeasure ?? (ticksPerBeat * beats)

  // track (fallback doc)
  const tracks = Array.isArray(doc?.tracks) ? doc.tracks : []
  const track = tracks[0]

  // tuning
  const tuning =
    Array.isArray(track?.tuning) && track.tuning.length === 6 ? track.tuning : STANDARD_TUNING

  // Dépendances “propres” pour le memo
  const modelFirstEvents = model?.measures?.[0]?.events || null
  const modelFirstAbsIndex = model?.measures?.[0]?.absIndex ?? null
  const trackNotes = track?.notes

  // ---- Notes affichables (1 mesure) ----
  const { notesForMeasure, measureLabelAbsIndex } = useMemo(() => {
    // Cas MODEL (prioritaire)
    if (Array.isArray(modelFirstEvents)) {
      const absIndex = typeof modelFirstAbsIndex === 'number' ? modelFirstAbsIndex : 0

      const notes = modelFirstEvents.map((e) => {
        const rawTickInMeasure =
          typeof e.tickInMeasure === 'number'
            ? e.tickInMeasure
            : (typeof e.startTick === 'number'
              ? (e.startTick - absIndex * ticksPerMeasure)
              : 0)

        const start = Math.max(0, Math.min(ticksPerMeasure - 1, Math.round(rawTickInMeasure)))

        return {
          start,
          duration: e.durTicks ?? e.duration ?? 0,
          pitch: e.pitch,
          string: e.string,
          fret: e.fret,
        }
      })

      return { notesForMeasure: notes, measureLabelAbsIndex: absIndex }
    }

    // Cas DOC fallback
    const normalized = normalizeNotes(trackNotes, tuning)
    if (!normalized.length) return { notesForMeasure: [], measureLabelAbsIndex: 0 }

    const firstStart = normalized[0].start || 0
    const firstAbsMeasure = Math.floor(firstStart / ticksPerMeasure)
    const startOfThatMeasure = firstAbsMeasure * ticksPerMeasure
    const endOfThatMeasure = startOfThatMeasure + ticksPerMeasure

    const inMeasure = normalized
      .filter((n) => n.start >= startOfThatMeasure && n.start < endOfThatMeasure)
      .map((n) => ({
        ...n,
        start: n.start - startOfThatMeasure,
      }))

    return { notesForMeasure: inMeasure, measureLabelAbsIndex: firstAbsMeasure }
  }, [
    ticksPerMeasure,
    tuning,
    trackNotes,
    modelFirstAbsIndex,
    modelFirstEvents,
  ])

  // Normalisation pitch -> tab
  const notes = useMemo(() => normalizeNotes(notesForMeasure, tuning), [notesForMeasure, tuning])

  // Groupes d'accords + flags
  const groupsRaw = useMemo(() => groupNotesByStart(notes), [notes])
  const groups = useMemo(() => addRhythmInfo(groupsRaw, ppq), [groupsRaw, ppq])

  // Segments de beams
  const beamSegments = useMemo(
    () => computeBeamSegments(groups, ticksPerBeat),
    [groups, ticksPerBeat]
  )

  // Construire une map: startTick -> "max beams" auquel cette note participe
  // (utile pour dessiner hampes longues uniquement sur les notes beamed)
  const beamedLevelByStart = useMemo(() => {
    const m = new Map()
    for (const seg of beamSegments) {
      for (let i = 0; i < seg.length - 1; i += 1) {
        const a = seg[i]
        const b = seg[i + 1]
        const beams = Math.min(a._flags ?? 0, b._flags ?? 0)
        if (beams <= 0) continue

        m.set(a.start, Math.max(m.get(a.start) ?? 0, beams))
        m.set(b.start, Math.max(m.get(b.start) ?? 0, beams))
      }
    }
    return m
  }, [beamSegments])

  // ---- Layout SVG ----
  const width = 1100
  const margin = { left: 50, right: 30, top: 26, bottom: 30 }

  const rhythmTop = 18
  const tabTop = 90
  const stringGap = 18
  const strings = 6
  const tabHeight = (strings - 1) * stringGap
  const tabBottom = tabTop + tabHeight

  const measureWidth = width - margin.left - margin.right

  const xForTick = (t) => {
    const clamped = Math.max(0, Math.min(ticksPerMeasure, t))
    const ratio = clamped / ticksPerMeasure
    return margin.left + ratio * measureWidth
  }

  const yForString = (s) => tabTop + (s - 1) * stringGap

  // Style beaming (GP tab)
  const beamY = rhythmTop + 10
  const beamThickness = 4
  const beamGap = 7

  return (
    <div style={{ marginTop: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Tablature (style Guitar Pro)</h2>

      <div style={{ color: '#666', marginBottom: 10 }}>
        GP tab : hampes accrochées + beaming (sans têtes de notes). PPQ={ppq}, {beats}/{beatType}, TPM={ticksPerMeasure}
        {typeof measureLabelAbsIndex === 'number' ? `, absMeasure=${measureLabelAbsIndex}` : ''}
        {`, events=${notesForMeasure?.length ?? 0}`}
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${tabBottom + margin.bottom}`}
        style={{ border: '1px solid #ddd', borderRadius: 8, background: 'white' }}
      >
        {/* Lignes de cordes */}
        {Array.from({ length: strings }).map((_, i) => {
          const s = i + 1
          const y = yForString(s)
          return (
            <line
              key={s}
              x1={margin.left}
              y1={y}
              x2={width - margin.right}
              y2={y}
              stroke="black"
              strokeWidth="1"
              opacity="0.85"
            />
          )
        })}

        {/* Barres de mesure */}
        <line
          x1={margin.left}
          y1={tabTop - 12}
          x2={margin.left}
          y2={tabBottom + 12}
          stroke="black"
          strokeWidth="2"
        />
        <line
          x1={width - margin.right}
          y1={tabTop - 12}
          x2={width - margin.right}
          y2={tabBottom + 12}
          stroke="black"
          strokeWidth="2"
        />

        {/* Traits de temps + numéros (1..beats) */}
        {Array.from({ length: beats }).map((_, i) => {
          const beatIdx = i + 1
          const t = i * ticksPerBeat
          const x = xForTick(t)

          return (
            <g key={beatIdx}>
              {i > 0 && (
                <line
                  x1={x}
                  y1={tabTop - 12}
                  x2={x}
                  y2={tabBottom + 12}
                  stroke="black"
                  strokeWidth="1"
                  opacity="0.45"
                />
              )}
              <text
                x={x + (i === 0 ? 0 : 2)}
                y={rhythmTop + 10}
                fontSize="12"
                fontFamily="ui-sans-serif, system-ui"
                fill="black"
                opacity="0.65"
              >
                {beatIdx}
              </text>
            </g>
          )
        })}

        {/* Beaming (liaisons) */}
        {beamSegments.map((seg, si) => (
          <g key={`beamseg-${si}`}>
            {seg.slice(0, -1).map((a, k) => {
              const b = seg[k + 1]
              const x1 = xForTick(a.start)
              const x2 = xForTick(b.start)

              const beams = Math.min(a._flags ?? 0, b._flags ?? 0)
              if (beams <= 0) return null

              return (
                <g key={`beampair-${si}-${k}`}>
                  {Array.from({ length: beams }).map((_, level) => {
                    const y = beamY + level * beamGap
                    return (
                      <line
                        key={`beam-${si}-${k}-${level}`}
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke="black"
                        strokeWidth={beamThickness}
                        strokeLinecap="butt"
                      />
                    )
                  })}
                </g>
              )
            })}
          </g>
        ))}

        {/* Notes tab + hampes */}
        {groups.map((g, gi) => {
          const x = xForTick(g.start)
          const noteType = g._noteType || durationToNoteType(g.duration || ppq, ppq)
          const drawStem = !!noteType.stem

          // Ancrage de la hampe : au-dessus de la corde la plus aiguë dans l'accord
          const chordTopY = Math.min(...g.notes.map((n) => yForString(n.string)))
          const stemAttachY = chordTopY - 12 // ajustable

          // Si cette position participe à un beaming, hampe longue jusqu’au beam.
          // Sinon hampe courte (beaucoup plus "Guitar Pro")
          const beamedLevel = beamedLevelByStart.get(g.start) ?? 0
          const longStemTopY = beamY + Math.max(0, beamedLevel - 1) * beamGap
          const shortStemTopY = stemAttachY - 26

          const stemTopY = beamedLevel > 0 ? longStemTopY : shortStemTopY

          return (
            <g key={gi}>
              {/* cases */}
              {g.notes.map((n, ni) => {
                const y = yForString(n.string)
                const fret = String(n.fret)

                return (
                  <g key={ni}>
                    <rect
                      x={x - 10}
                      y={y - 9}
                      width={Math.max(18, fret.length * 9 + 10)}
                      height={18}
                      rx={5}
                      fill="white"
                      stroke="black"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      fontSize="12"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                    >
                      {fret}
                    </text>
                  </g>
                )
              })}

              {/* hampe */}
              {drawStem && (
                <line
                  x1={x}
                  y1={stemAttachY}
                  x2={x}
                  y2={stemTopY}
                  stroke="black"
                  strokeWidth="2"
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
