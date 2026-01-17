import { useMemo, useState } from 'react'

// Standard tuning guitare (string 1..6): E4 B3 G3 D3 A2 E2
const STANDARD_TUNING = [64, 59, 55, 50, 45, 40]

// mapping pitch -> (string,fret) simple : fret minimal dans [0..24]
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

      const string = typeof n.string === 'number' ? n.string : null
      const fret = typeof n.fret === 'number' ? n.fret : null

      if (string && fret !== null) return { ...n, string, fret }

      const inf = inferStringFret(pitch, tuning)
      if (!inf) return null
      return { ...n, string: inf.string, fret: inf.fret }
    })
    .filter(Boolean)
}

// Rendu texte monospaced : 1 mesure = 16 pas/temps (16e), donc 4/4 => 64 colonnes
function buildMeasureGrid(trackNotes, ppq, beats, beatType, measureIndex) {
  const ticksPerBeat = ppq * (4 / beatType)
  const ticksPerMeasure = ticksPerBeat * beats
  const startTick = measureIndex * ticksPerMeasure
  const endTick = startTick + ticksPerMeasure

  const stepTicks = ticksPerBeat / 4 // 16e
  const cols = beats * 16

  // 6 lignes cordes (1 = aigu en haut)
  const lines = Array.from({ length: 6 }, () => Array(cols).fill('-'))

  const inMeasure = trackNotes.filter((n) => n.start >= startTick && n.start < endTick)

  for (const n of inMeasure) {
    const s = n.string
    const fret = n.fret
    if (!(s >= 1 && s <= 6)) continue
    if (typeof fret !== 'number') continue

    const offset = n.start - startTick
    const col = Math.max(0, Math.min(cols - 1, Math.round(offset / stepTicks)))

    const txt = String(fret)
    // place 1 ou 2 chiffres (si 2 chiffres, on écrase col+1)
    lines[s - 1][col] = txt[0]
    if (txt.length > 1 && col + 1 < cols) lines[s - 1][col + 1] = txt[1]
  }

  return lines.map((arr) => arr.join(''))
}

export default function TabViewer({ doc }) {
  const ppq = doc?.ppq || 480
  const [beats, beatType] = doc?.time_signature || [4, 4]

  const tracks = Array.isArray(doc?.tracks) ? doc.tracks : []
  const [trackIndex, setTrackIndex] = useState(tracks[0]?.index ?? 0)

  const track = tracks.find((t) => t?.index === trackIndex) || tracks[0]
  const tuning = Array.isArray(track?.tuning) && track.tuning.length === 6 ? track.tuning : STANDARD_TUNING

  const notes = useMemo(() => normalizeNotes(track?.notes, tuning), [track?.notes, tuning])

  // mesure count (fallback simple)
  const measuresCount = track?.measures_count || Math.min(200, Math.ceil((notes.at(-1)?.start || 0) / (ppq * beats))) || 1
  const displayMeasures = Math.min(measuresCount, 12) // MVP : afficher 12 mesures max (on paginera ensuite)

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <strong>Tablature</strong>

        <label>
          Track:&nbsp;
          <select value={trackIndex} onChange={(e) => setTrackIndex(Number(e.target.value))}>
            {tracks.map((t) => (
              <option key={t.index} value={t.index}>
                {t.name || `Track ${t.index}`}
              </option>
            ))}
          </select>
        </label>

        <span style={{ color: '#666' }}>
          Signature: {beats}/{beatType} · PPQ: {ppq} · Notes affichées: {notes.length}
        </span>
      </div>

      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
        {Array.from({ length: displayMeasures }).map((_, mi) => {
          const lines = buildMeasureGrid(notes, ppq, beats, beatType, mi)
          // Affichage corde 1 en haut (E4), corde 6 en bas (E2)
          return (
            <div key={mi} style={{ marginBottom: 10, padding: 10, border: '1px solid #ddd', borderRadius: 6 }}>
              <div style={{ marginBottom: 6, color: '#666' }}>Mesure {mi + 1}</div>
              <pre style={{ margin: 0, whiteSpace: 'pre' }}>
{`e|${lines[0]}|
B|${lines[1]}|
G|${lines[2]}|
D|${lines[3]}|
A|${lines[4]}|
E|${lines[5]}|`}
              </pre>
            </div>
          )
        })}
        {measuresCount > displayMeasures && (
          <div style={{ color: '#666' }}>
            (MVP) Affichage limité à {displayMeasures} mesures. On ajoutera pagination/scroll ensuite.
          </div>
        )}
      </div>
    </div>
  )
}
