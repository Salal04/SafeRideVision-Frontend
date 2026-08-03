import { motion } from 'framer-motion'

const wrap = 'relative w-full aspect-[5/4] rounded-xl panel-border bg-asphalt overflow-hidden hud-grid-bg'

export function DetectVisual() {
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex items-center justify-center gap-6">
        {[0, 1].map((n) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: n * 0.3, duration: 0.5 }}
            className="relative h-20 w-28 rounded-md border-2 border-cyan shadow-[0_0_16px_rgba(47,230,217,0.35)]"
          >
            <span className="absolute -top-6 left-0 font-mono text-[10px] text-cyan bg-asphalt border border-cyan/40 rounded px-1">
              bike {n === 0 ? '0.94' : '0.88'}
            </span>
            <svg viewBox="0 0 60 40" className="absolute inset-0 w-full h-full p-2" fill="none">
              <circle cx="14" cy="30" r="7" stroke="#3a4353" strokeWidth="2" />
              <circle cx="46" cy="30" r="7" stroke="#3a4353" strokeWidth="2" />
              <path d="M14 30 L30 15 L38 15 L46 30" stroke="#3a4353" strokeWidth="2" fill="none" />
            </svg>
          </motion.div>
        ))}
      </div>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] text-muted-2">yolo \u2192 bounding boxes per frame</span>
    </div>
  )
}

export function TrackVisual() {
  return (
    <div className={wrap}>
      <svg viewBox="0 0 200 140" className="absolute inset-0 w-full h-full">
        <path d="M20 100 Q 80 40 100 60 T 180 30" stroke="#2fe6d9" strokeWidth="2" fill="none" className="animate-dash-flow" opacity="0.6" />
        {[
          [20, 100], [55, 65], [100, 60], [140, 42], [180, 30],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i === 4 ? 6 : 4} fill={i === 4 ? '#2fe6d9' : '#1a8f88'} />
          </g>
        ))}
        <text x="150" y="20" fill="#2fe6d9" fontSize="9" fontFamily="monospace">ID:042</text>
      </svg>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] text-muted-2">deepsort \u2192 same id, every frame</span>
    </div>
  )
}

export function MirrorVisual() {
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 160 100" className="w-3/4" fill="none">
          <path d="M20 80 L70 45 L95 45 L130 80" stroke="#3a4353" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="80" r="14" stroke="#3a4353" strokeWidth="3" />
          <circle cx="130" cy="80" r="14" stroke="#3a4353" strokeWidth="3" />
          <motion.circle
            cx="72" cy="40" r="7"
            stroke="#ffb020" strokeWidth="2" fill="rgba(255,176,32,0.12)"
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <span className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-amber bg-asphalt border border-amber/40 rounded px-1.5">
          mirror
        </span>
      </div>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] text-muted-2">anchors where the indicator should be</span>
    </div>
  )
}

export function IndicatorVisual() {
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-16 w-16 rounded-full border-2 border-amber flex items-center justify-center animate-blink-pulse">
          <div className="h-8 w-8 rounded-full bg-amber" />
        </div>
      </div>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] text-muted-2">indicator lamp \u2192 on / off per frame</span>
      <span className="absolute top-3 right-3 font-mono text-[10px] text-amber">STATE: ON</span>
    </div>
  )
}

export function OrientationVisual() {
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex items-center justify-center gap-8">
        {['SIDE', 'FRONT'].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: i === 0 ? -10 : 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.25, duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            <svg viewBox="0 0 60 50" className="w-16 h-14" fill="none">
              {i === 0 ? (
                <path d="M8 40 L25 22 L35 22 L52 40 M8 40 a6 6 0 1 0 0.1 0 M52 40 a6 6 0 1 0 0.1 0" stroke="#2fe6d9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : (
                <rect x="20" y="14" width="20" height="28" rx="4" stroke="#ffb020" strokeWidth="2.5" fill="none" />
              )}
            </svg>
            <span className={`font-mono text-[10px] ${i === 0 ? 'text-cyan' : 'text-amber'}`}>{label}</span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="absolute font-mono text-[10px] text-text bg-panel border border-line rounded px-2 py-1 top-3"
        >
          side \u2192 front = turning
        </motion.div>
      </div>
    </div>
  )
}

export function HistoryVisual() {
  const bits = [0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0]
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-1.5">
          {bits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`h-8 w-4 rounded-sm ${b ? 'bg-amber' : 'bg-line'}`}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] text-muted-2">per-frame indicator state, one bike, one buffer</span>
      </div>
    </div>
  )
}

export function BlinkVisual() {
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="h-16 w-10 rounded bg-panel-2 border border-line flex items-end justify-center overflow-hidden">
            <motion.div
              className="w-full bg-cyan/30"
              initial={{ height: '20%' }}
              whileInView={{ height: '75%' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className="font-mono text-[9px] text-muted-2">resnet</span>
        </div>
        <span className="font-mono text-cyan text-xs">\u2192</span>
        <div className="flex flex-col items-center gap-1">
          <div className="h-16 w-16 rounded-md border border-cyan/40 bg-cyan/5 flex items-center justify-center">
            <span className="font-mono text-[9px] text-cyan leading-tight text-center">seq<br/>model</span>
          </div>
          <span className="font-mono text-[9px] text-muted-2">lstm</span>
        </div>
        <span className="font-mono text-cyan text-xs">\u2192</span>
        <div className="flex flex-col items-center gap-1">
          <div className="h-16 w-16 rounded-md border border-green/50 bg-green/10 flex items-center justify-center">
            <span className="font-mono text-[10px] text-green">TRUE</span>
          </div>
          <span className="font-mono text-[9px] text-muted-2">blinking?</span>
        </div>
      </div>
    </div>
  )
}

export function VerdictVisual() {
  return (
    <div className={wrap}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-amber border border-amber/40 bg-amber/5 rounded px-2 py-1">turn: yes</span>
          <span className="text-muted">+</span>
          <span className="text-red border border-red/40 bg-red/5 rounded px-2 py-1">indicator: off</span>
        </div>
        <span className="text-muted-2">\u2193</span>
        <span className="font-mono text-sm text-red border border-red/50 bg-red/10 rounded-md px-3 py-1.5">
          VIOLATION LOGGED
        </span>
      </div>
    </div>
  )
}
