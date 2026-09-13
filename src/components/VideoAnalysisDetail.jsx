// The full per-video deep-dive: one component, two sections —
//   1. Analysis   — aggregate charts derived from the bikes CSV (donut,
//                    coverage bars, compliance gauge, top violators)
//   2. Bikes      — every tracked bike, as a photo gallery OR a dense,
//                    sortable data table with every CSV field
//
// Used in two places (same component, same look, per the request that a
// freshly-processed result and a video reopened from "View results" show
// identical depth):
//   - Upload.jsx, right under "Processing complete"
//   - Upload.jsx's VideoDetailModal, opened via a video card's "View Details"

import { useMemo, useState } from 'react'
import {
  BarChart3, Bike, ShieldAlert, ShieldCheck, Signpost, ScanLine,
  LayoutGrid, Table2, ChevronUp, ChevronDown, ImageOff, X, ArrowUpDown,
} from 'lucide-react'
import { Frame, PlateReadout, VerdictRibbon, Pill, StatCard, BikeGallery, DossierModal, downloadCsv } from './BikeDossier.jsx'

// ---------------------------------------------------------------------
// Donut chart — pure SVG, no charting library. Each segment is one
// <circle> stroked as an arc (stroke-dasharray = share of the
// circumference, stroke-dashoffset = where it starts), stacked around a
// circle rotated -90deg so the first segment starts at 12 o'clock.
// ---------------------------------------------------------------------
function Donut({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const r = 40
  const circumference = 2 * Math.PI * r
  let offsetSoFar = 0

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-32 sm:h-32 -rotate-90 shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth="14" />
        {segments.map((s, i) => {
          const share = s.value / total
          const dash = share * circumference
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offsetSoFar}
              strokeLinecap={segments.length > 1 ? 'butt' : 'round'}
            />
          )
          offsetSoFar += dash
          return el
        })}
      </svg>
      <div className="flex-1 min-w-0">
        {centerValue != null && (
          <div className="mb-2">
            <div className="font-display text-2xl leading-none">{centerValue}</div>
            <div className="font-mono text-[10px] text-muted-2 uppercase tracking-wide">{centerLabel}</div>
          </div>
        )}
        <div className="space-y-1.5">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-muted font-mono">{s.label}</span>
              <span className="text-muted-2 font-mono ml-auto">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CoverageBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] text-muted mb-1">
        <span>{label}</span>
        <span className="text-muted-2">{value}/{total} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ComplianceGauge({ rate }) {
  const pct = rate == null ? null : Math.round(rate * 100)
  const color = pct == null ? 'var(--color-muted-2)' : pct >= 80 ? 'var(--color-green)' : pct >= 50 ? 'var(--color-amber)' : 'var(--color-red)'
  const r = 40
  const circumference = 2 * Math.PI * r
  const dash = pct == null ? 0 : (pct / 100) * circumference

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90 shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth="12" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div>
        <div className="font-display text-2xl leading-none" style={{ color }}>
          {pct == null ? '—' : `${pct}%`}
        </div>
        <div className="font-mono text-[10px] text-muted-2 uppercase tracking-wide mt-1">Signal compliance<br />on turns</div>
      </div>
    </div>
  )
}

// Reuses the existing case-file modal for the "jump to this violator" click
// inside the Analysis tab.
const BikeQuickModal = DossierModal

function AnalysisTab({ bikes, summary }) {
  const s = summary || {}
  const total = s.total_bikes ?? bikes.length
  const turned = s.turned ?? bikes.filter((b) => b.everTurned).length
  const violations = s.violations ?? bikes.filter((b) => b.violation).length
  const signaledCorrectly = s.signaled_correctly ?? (turned - violations)
  const noTurn = total - turned
  const platesRead = s.plates_read ?? bikes.filter((b) => b.plateNumber).length
  const mirrorsBoth = bikes.filter((b) => b.mirrorSeenBoth).length
  const indicatorBoth = bikes.filter((b) => b.indicatorSeenBoth).length
  const violators = bikes.filter((b) => b.violation)
  const [openBike, setOpenBike] = useState(null)

  if (total === 0) {
    return <p className="text-sm text-muted text-center py-12">No bikes were tracked in this run.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="rounded-lg border border-line-soft bg-panel-2/40 p-4">
          <p className="font-mono text-[11px] text-muted-2 uppercase tracking-wide mb-3">Turn outcome breakdown</p>
          <Donut
            centerLabel="tracked"
            centerValue={total}
            segments={[
              { label: 'Signaled correctly', value: signaledCorrectly, color: 'var(--color-green)' },
              { label: 'Violation (no signal)', value: violations, color: 'var(--color-red)' },
              { label: 'Never turned', value: noTurn, color: 'var(--color-line)' },
            ]}
          />
        </div>

        <div className="rounded-lg border border-line-soft bg-panel-2/40 p-4 flex flex-col justify-center">
          <p className="font-mono text-[11px] text-muted-2 uppercase tracking-wide mb-3">Compliance rate</p>
          <ComplianceGauge rate={s.compliance_rate} />
        </div>
      </div>

      <div className="rounded-lg border border-line-soft bg-panel-2/40 p-4 space-y-4">
        <p className="font-mono text-[11px] text-muted-2 uppercase tracking-wide">Detection coverage</p>
        <CoverageBar label="Plates read" value={platesRead} total={total} color="var(--color-cyan)" />
        <CoverageBar label="Both mirrors seen" value={mirrorsBoth} total={total} color="var(--color-amber)" />
        <CoverageBar label="Both indicators seen" value={indicatorBoth} total={total} color="var(--color-green)" />
      </div>

      <div className="rounded-lg border border-line-soft bg-panel-2/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[11px] text-muted-2 uppercase tracking-wide">
            Violators {violators.length > 0 && <span className="text-red">({violators.length})</span>}
          </p>
        </div>
        {violators.length === 0 ? (
          <p className="text-sm text-muted-2 font-mono">No violations recorded — every turn was signaled.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {violators.map((b) => (
              <button
                key={b.trackId}
                onClick={() => setOpenBike(b)}
                className="flex items-center gap-2 rounded-md border border-red/30 bg-red/5 hover:bg-red/10 px-3 py-1.5 transition-colors"
              >
                <ShieldAlert size={12} className="text-red" />
                <span className="font-mono text-xs text-muted-2">#{String(b.trackId).padStart(3, '0')}</span>
                <span className="font-mono text-xs tracking-[0.15em] text-red">
                  {b.plateNumber || 'PLATE UNREAD'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {openBike && (
        <BikeQuickModal bike={openBike} onClose={() => setOpenBike(null)} />
      )}
    </div>
  )
}



// ---------------------------------------------------------------------
// Modern, sortable data table — literally every CSV field, one bike per
// row, with a lightbox button to blow up the plate crop when one exists.
// ---------------------------------------------------------------------
function SortHeader({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-3 py-2.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-wide text-muted-2 cursor-pointer select-none hover:text-cyan transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        ) : (
          <ArrowUpDown size={10} className="opacity-30" />
        )}
      </span>
    </th>
  )
}

function PlateLightbox({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-muted-2 uppercase tracking-wide">Plate crop</span>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>
        <Frame src={src} alt="Plate crop" className="w-full aspect-video rounded-lg border border-cyan/30" />
      </div>
    </div>
  )
}

function BikeTable({ bikes }) {
  const [sort, setSort] = useState({ key: 'trackId', dir: 'asc' })
  const [lightbox, setLightbox] = useState(null)

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  const sorted = useMemo(() => {
    const copy = [...bikes]
    copy.sort((a, b) => {
      let av = a[sort.key]
      let bv = b[sort.key]
      if (typeof av === 'boolean') { av = av ? 1 : 0; bv = bv ? 1 : 0 }
      if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase() }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [bikes, sort])

  if (bikes.length === 0) {
    return <p className="text-sm text-muted text-center py-12">No bikes to show.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line-soft">
      <table className="w-full text-sm">
        <thead className="bg-panel-2/60">
          <tr>
            <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wide text-muted-2">Snapshot</th>
            <SortHeader label="Track ID" sortKey="trackId" sort={sort} onSort={toggleSort} />
            <SortHeader label="Plate" sortKey="plateNumber" sort={sort} onSort={toggleSort} />
            <SortHeader label="Plate Detected" sortKey="plateDetected" sort={sort} onSort={toggleSort} />
            <SortHeader label="Mirrors" sortKey="mirrorSeenBoth" sort={sort} onSort={toggleSort} />
            <SortHeader label="Indicator" sortKey="indicatorSeenBoth" sort={sort} onSort={toggleSort} />
            <SortHeader label="Turned" sortKey="everTurned" sort={sort} onSort={toggleSort} />
            <SortHeader label="Signaled" sortKey="signaled" sort={sort} onSort={toggleSort} />
            <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wide text-muted-2">Verdict</th>
            <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wide text-muted-2">Plate crop</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => (
            <tr key={b.trackId} className="border-t border-line-soft/60 hover:bg-panel-2/50 transition-colors">
              <td className="px-3 py-2">
                <Frame src={b.bikeImageUrl} empty="—" className="w-16 h-11 rounded border border-line-soft" />
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted">#{String(b.trackId).padStart(3, '0')}</td>
              <td className="px-3 py-2">
                <PlateReadout plateNumber={b.plateNumber} plateDetected={b.plateDetected} />
              </td>
              <td className="px-3 py-2"><Pill ok={b.plateDetected} label={b.plateDetected ? 'YES' : 'NO'} /></td>
              <td className="px-3 py-2"><Pill ok={b.mirrorSeenBoth} label={b.mirrorSeenBoth ? 'YES' : 'NO'} /></td>
              <td className="px-3 py-2"><Pill ok={b.indicatorSeenBoth} label={b.indicatorSeenBoth ? 'YES' : 'NO'} /></td>
              <td className="px-3 py-2"><Pill ok={b.everTurned} label={b.everTurned ? 'YES' : 'NO'} /></td>
              <td className="px-3 py-2"><Pill ok={b.signaled} label={b.signaled ? 'YES' : 'NO'} /></td>
              <td className="px-3 py-2"><VerdictRibbon everTurned={b.everTurned} violation={b.violation} /></td>
              <td className="px-3 py-2">
                {b.plateImageUrl ? (
                  <button
                    onClick={() => setLightbox(b.plateImageUrl)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan hover:text-cyan/70 transition-colors border border-cyan/30 rounded px-2 py-1"
                  >
                    <ScanLine size={12} /> View plate
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-2">
                    <ImageOff size={12} /> none
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lightbox && <PlateLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function BikesTab({ bikes }) {
  const [view, setView] = useState('gallery') // 'gallery' | 'table'
  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="inline-flex rounded-lg border border-line-soft p-0.5">
          <button
            onClick={() => setView('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] transition-colors ${
              view === 'gallery' ? 'bg-cyan/10 text-cyan' : 'text-muted-2 hover:text-muted'
            }`}
          >
            <LayoutGrid size={13} /> Gallery
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] transition-colors ${
              view === 'table' ? 'bg-cyan/10 text-cyan' : 'text-muted-2 hover:text-muted'
            }`}
          >
            <Table2 size={13} /> Table
          </button>
        </div>
      </div>
      {view === 'gallery' ? <BikeGallery bikes={bikes} /> : <BikeTable bikes={bikes} />}
    </div>
  )
}

export default function VideoAnalysisDetail({ bikes = [], summary, csvDownloadUrl }) {
  const [tab, setTab] = useState('analysis') // 'analysis' | 'bikes'
  const s = summary || {}

  return (
    <div className="rounded-xl panel-border bg-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-line-soft flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-line-soft p-0.5">
          <button
            onClick={() => setTab('analysis')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-mono text-xs transition-colors ${
              tab === 'analysis' ? 'bg-cyan/10 text-cyan' : 'text-muted-2 hover:text-muted'
            }`}
          >
            <BarChart3 size={14} /> Analysis
          </button>
          <button
            onClick={() => setTab('bikes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-mono text-xs transition-colors ${
              tab === 'bikes' ? 'bg-cyan/10 text-cyan' : 'text-muted-2 hover:text-muted'
            }`}
          >
            <Bike size={14} /> Bikes <span className="text-muted-2">({bikes.length})</span>
          </button>
        </div>
        {csvDownloadUrl && (
          <button
            onClick={() => downloadCsv(csvDownloadUrl, 'safe-ride-vision-bikes.csv')}
            className="text-xs font-mono text-muted hover:text-cyan transition-colors"
          >
            Download CSV
          </button>
        )}
      </div>

      <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Bike} label="Bikes tracked" value={s.total_bikes ?? bikes.length} tone="cyan" />
        <StatCard icon={Signpost} label="Turned" value={s.turned ?? 0} tone="amber" />
        <StatCard icon={ShieldAlert} label="Violations" value={s.violations ?? 0} tone="red" />
        <StatCard icon={ScanLine} label="Plates read" value={s.plates_read ?? 0} tone="green" />
      </div>

      <div className="p-5">
        {tab === 'analysis' ? <AnalysisTab bikes={bikes} summary={summary} /> : <BikesTab bikes={bikes} />}
      </div>
    </div>
  )
}
