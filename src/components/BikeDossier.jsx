// "Case file" per detected bike — the creative replacement for the old flat
// detection-log table. Every bike DeepSORT tracked long enough to matter
// gets one card: its clearest boxed photo, its plate crop rendered like an
// ANPR readout, and a verdict ribbon (turned-without-signaling = VIOLATION).
//
// Drop-in usage (see Upload.jsx):
//   <BikeDossierPanel bikes={result.bikes} summary={result.summary} csvDownloadUrl={result.csvDownloadUrl} />
//
// `bikes` items are the shape api.js's normalizeBikes() produces:
//   { trackId, plateNumber, plateDetected, mirrorSeenBoth, indicatorSeenBoth,
//     everTurned, signaled, violation, bikeImageUrl, plateImageUrl }

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bike, ShieldAlert, ShieldCheck, Signpost, ScanLine, Download,
  X, Copy, Check, CircleSlash, Loader2, AlertTriangle, Eye,
} from 'lucide-react'

// Same "ngrok free-tier interstitial has no CORS headers" problem the video
// player already works around (see Upload.jsx's useNgrokVideoBlob) — a bare
// <img src="https://...ngrok.../outputs/..."> request from the browser
// carries no custom header, so without this it would render the "you are
// about to visit..." warning page as a broken image instead of the crop.
function useNgrokImage(src) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [status, setStatus] = useState(src ? 'loading' : 'empty') // empty | loading | ready | error

  useEffect(() => {
    if (!src) {
      setStatus('empty')
      setBlobUrl(null)
      return
    }
    let cancelled = false
    let objectUrl = null
    setStatus('loading')

    fetch(src, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  return { blobUrl, status }
}

export function Frame({ src, alt, empty, className = '' }) {
  const { blobUrl, status } = useNgrokImage(src)

  if (status === 'empty') {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 bg-panel-2 text-muted-2 ${className}`}>
        <CircleSlash size={18} />
        <span className="text-[10px] font-mono">{empty || 'not available'}</span>
      </div>
    )
  }
  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-panel-2 ${className}`}>
        <Loader2 size={16} className="animate-spin text-cyan" />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 bg-panel-2 text-red/70 ${className}`}>
        <AlertTriangle size={16} />
        <span className="text-[10px] font-mono">failed to load</span>
      </div>
    )
  }
  return <img src={blobUrl} alt={alt} className={`object-cover ${className}`} />
}

// The plate itself, rendered like an ANPR readout (glowing mono digits on
// black) rather than a literal license-plate graphic — matches the app's
// HUD language instead of looking like clip art.
export function PlateReadout({ plateNumber, plateDetected }) {
  if (plateNumber) {
    return (
      <div className="rounded-md border border-cyan/30 bg-black/60 px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-mono text-base sm:text-lg tracking-[0.25em] text-cyan text-glow-cyan">
          {plateNumber}
        </span>
        <ScanLine size={14} className="text-cyan/60 shrink-0" />
      </div>
    )
  }
  return (
    <div className="rounded-md border border-dashed border-line-soft bg-black/30 px-3 py-2 flex items-center justify-between gap-2">
      <span className="font-mono text-xs text-muted-2">
        {plateDetected ? 'PLATE SEEN — OCR FAILED' : 'PLATE NOT FOUND'}
      </span>
      <CircleSlash size={13} className="text-muted-2 shrink-0" />
    </div>
  )
}

export function VerdictRibbon({ everTurned, violation }) {
  if (!everTurned) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-line-soft bg-panel-2/80 px-2 py-0.5 font-mono text-[10px] text-muted-2">
        <Signpost size={11} /> NO TURN
      </span>
    )
  }
  if (violation) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red/40 bg-red/10 px-2 py-0.5 font-mono text-[10px] text-red">
        <ShieldAlert size={11} /> VIOLATION
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green/40 bg-green/10 px-2 py-0.5 font-mono text-[10px] text-green">
      <ShieldCheck size={11} /> SIGNALED
    </span>
  )
}

export function Pill({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] ${
        ok ? 'border-cyan/30 text-cyan bg-cyan/5' : 'border-line-soft text-muted-2'
      }`}
    >
      {ok ? <Check size={10} /> : <X size={10} />} {label}
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, tone }) {
  const toneCls = {
    cyan: 'text-cyan border-cyan/25',
    amber: 'text-amber border-amber/25',
    red: 'text-red border-red/25',
    green: 'text-green border-green/25',
    muted: 'text-muted border-line-soft',
  }[tone || 'muted']

  return (
    <div className={`rounded-lg border bg-panel px-4 py-3 flex items-center gap-3 ${toneCls}`}>
      <Icon size={18} />
      <div>
        <div className="font-display text-xl leading-none">{value}</div>
        <div className="font-mono text-[10px] text-muted-2 mt-1 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}

export function DossierCard({ bike, onOpen }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(bike)}
      className={`text-left rounded-xl overflow-hidden border bg-panel transition-colors group ${
        bike.violation ? 'border-red/30 hover:border-red/60' : 'border-line hover:border-cyan/40'
      }`}
    >
      <div className="relative aspect-video">
        <Frame src={bike.bikeImageUrl} alt={`Bike ${bike.trackId}`} empty="no snapshot" className="w-full h-full" />
        <div className="absolute top-2 left-2 font-mono text-[10px] px-2 py-0.5 rounded-full bg-black/70 border border-line-soft text-muted">
          #{String(bike.trackId).padStart(3, '0')}
        </div>
        <div className="absolute top-2 right-2">
          <VerdictRibbon everTurned={bike.everTurned} violation={bike.violation} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
          <span className="flex items-center gap-1 text-[11px] font-mono text-text/90">
            <Eye size={12} /> open case file
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        <PlateReadout plateNumber={bike.plateNumber} plateDetected={bike.plateDetected} />
        <div className="flex flex-wrap gap-1.5">
          <Pill ok={bike.mirrorSeenBoth} label="MIRRORS" />
          <Pill ok={bike.indicatorSeenBoth} label="INDICATOR" />
          <Pill ok={bike.everTurned} label="TURNED" />
          <Pill ok={bike.signaled} label="SIGNALED" />
        </div>
      </div>
    </motion.button>
  )
}

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  if (!text) return null
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {
          /* clipboard not available — silently ignore */
        }
      }}
      className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-cyan transition-colors"
    >
      {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
      {copied ? 'copied' : 'copy plate'}
    </button>
  )
}

export function DossierModal({ bike, onClose }) {
  if (!bike) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-xl border border-line bg-panel overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
            <div className="flex items-center gap-2.5">
              <Bike size={16} className="text-cyan" />
              <span className="font-mono text-sm">Case file — #{String(bike.trackId).padStart(3, '0')}</span>
            </div>
            <button onClick={onClose} className="text-muted hover:text-text transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <VerdictRibbon everTurned={bike.everTurned} violation={bike.violation} />
              <div className="flex items-center gap-2">
                <PlateReadout plateNumber={bike.plateNumber} plateDetected={bike.plateDetected} />
                <CopyButton text={bike.plateNumber} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[11px] text-muted-2 mb-1.5 uppercase tracking-wide">Bike snapshot</p>
                <Frame
                  src={bike.bikeImageUrl}
                  alt="Bike snapshot"
                  empty="no snapshot captured"
                  className="w-full aspect-video rounded-lg border border-line-soft"
                />
              </div>
              <div>
                <p className="font-mono text-[11px] text-muted-2 mb-1.5 uppercase tracking-wide">Plate crop</p>
                <Frame
                  src={bike.plateImageUrl}
                  alt="Plate crop"
                  empty="plate never isolated"
                  className="w-full aspect-video rounded-lg border border-line-soft"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Pill ok={bike.mirrorSeenBoth} label="BOTH MIRRORS" />
              <Pill ok={bike.indicatorSeenBoth} label="BOTH INDICATORS" />
              <Pill ok={bike.everTurned} label="TURNED" />
              <Pill ok={bike.signaled} label="SIGNALED WHILE TURNING" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'violation', label: 'Violations' },
  { id: 'signaled', label: 'Signaled correctly' },
  { id: 'noplate', label: 'Plate not read' },
]

// Same "fetch with the ngrok header, then trigger a real download" pattern
// as the video download link in Upload.jsx — a plain <a href> would hit the
// ngrok interstitial instead of the CSV bytes.
export async function downloadCsv(url, filename) {
  try {
    const res = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' } })
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank')
  }
}

// The filterable card grid + click-to-open modal, pulled out so it can be
// reused as one tab inside VideoAnalysisDetail.jsx as well as standalone.
export function BikeGallery({ bikes = [] }) {
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState(null)

  const filtered = bikes.filter((b) => {
    if (filter === 'violation') return b.violation
    if (filter === 'signaled') return b.everTurned && b.signaled
    if (filter === 'noplate') return !b.plateNumber
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`font-mono text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.id
                ? 'border-cyan/50 text-cyan bg-cyan/10'
                : 'border-line-soft text-muted-2 hover:text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">No bikes match this filter.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bike) => (
            <DossierCard key={bike.trackId} bike={bike} onOpen={setActive} />
          ))}
        </div>
      )}

      {active && <DossierModal bike={active} onClose={() => setActive(null)} />}
    </div>
  )
}

export default function BikeDossierPanel({ bikes = [], summary, csvDownloadUrl }) {
  const s = summary || {}

  return (
    <div className="rounded-xl panel-border bg-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-line-soft flex items-center justify-between flex-wrap gap-3">
        <span className="flex items-center gap-2 font-mono text-sm">
          <Bike size={15} className="text-cyan" /> Bike case files
          <span className="text-muted-2 text-xs">— {bikes.length} tracked</span>
        </span>
        {csvDownloadUrl && (
          <button
            onClick={() => downloadCsv(csvDownloadUrl, 'safe-ride-vision-bikes.csv')}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-cyan transition-colors"
          >
            <Download size={13} /> Download CSV
          </button>
        )}
      </div>

      {/* Headline stat strip */}
      <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Bike} label="Bikes tracked" value={s.total_bikes ?? bikes.length} tone="cyan" />
        <StatCard icon={Signpost} label="Turned" value={s.turned ?? 0} tone="amber" />
        <StatCard icon={ShieldAlert} label="Violations" value={s.violations ?? 0} tone="red" />
        <StatCard icon={ScanLine} label="Plates read" value={s.plates_read ?? 0} tone="green" />
      </div>

      <div className="p-5">
        <BikeGallery bikes={bikes} />
      </div>
    </div>
  )
}
