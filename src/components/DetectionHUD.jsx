import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const sequence = [
  {
    id: 'detect',
    tag: 'YOLO',
    box: { top: '22%', left: '18%', width: '64%', height: '58%' },
    label: 'BIKE_042',
    sub: 'DETECTED  conf 0.94',
    tone: 'cyan',
  },
  {
    id: 'track',
    tag: 'DEEPSORT',
    box: { top: '22%', left: '18%', width: '64%', height: '58%' },
    label: 'BIKE_042',
    sub: 'TRACK ID LOCKED  f#128',
    tone: 'cyan',
  },
  {
    id: 'orient',
    tag: 'ORIENTATION',
    box: { top: '22%', left: '18%', width: '64%', height: '58%' },
    label: 'BIKE_042',
    sub: 'SIDE → FRONT  (turning)',
    tone: 'amber',
  },
  {
    id: 'indicator',
    tag: 'INDICATOR',
    box: { top: '30%', left: '58%', width: '20%', height: '16%' },
    label: 'R-BLINKER',
    sub: 'STATE: OFF',
    tone: 'red',
  },
  {
    id: 'history',
    tag: 'HISTORY BUFFER',
    box: { top: '22%', left: '18%', width: '64%', height: '58%' },
    label: 'BIKE_042',
    sub: '32-FRAME SEQUENCE → LSTM',
    tone: 'cyan',
  },
  {
    id: 'verdict',
    tag: 'VERDICT',
    box: { top: '22%', left: '18%', width: '64%', height: '58%' },
    label: 'BIKE_042',
    sub: 'TURN WITHOUT SIGNAL',
    tone: 'red',
    verdict: true,
  },
]

const toneMap = {
  cyan: { text: 'text-cyan', border: 'border-cyan', shadow: 'shadow-[0_0_18px_rgba(47,230,217,0.35)]' },
  amber: { text: 'text-amber', border: 'border-amber', shadow: 'shadow-[0_0_18px_rgba(255,176,32,0.35)]' },
  red: { text: 'text-red', border: 'border-red', shadow: 'shadow-[0_0_18px_rgba(255,71,87,0.35)]' },
}

export default function DetectionHUD() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % sequence.length), 2100)
    return () => clearInterval(t)
  }, [])

  const step = sequence[i]
  const tone = toneMap[step.tone]

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl border border-line bg-panel overflow-hidden hud-grid-bg">
      <div className="noise-overlay" />

      {/* top readout bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 border-b border-line bg-asphalt/60 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green animate-blink-pulse" />
          <span className="font-mono text-[11px] text-muted tracking-widest">LIVE_ANALYSIS.MP4</span>
        </div>
        <span className="font-mono text-[11px] text-muted-2">FRAME 00128</span>
      </div>

      {/* scanning sweep */}
      <div className="absolute inset-x-0 top-10 bottom-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan/10 to-transparent animate-scan-sweep" />
      </div>

      {/* silhouette */}
      <div className="absolute inset-0 flex items-center justify-center pt-6">
        <svg viewBox="0 0 200 120" className="w-3/5 opacity-90" fill="none">
          <g stroke="#3a4353" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="45" cy="90" r="20" />
            <circle cx="155" cy="90" r="20" />
            <path d="M45 90 L90 55 L120 55 L155 90" />
            <path d="M90 55 L75 30 L100 30" />
            <path d="M100 30 L130 40 L120 55" />
            <path d="M75 30 L55 25" />
          </g>
          <circle cx="170" cy="78" r="5" fill={step.id === 'indicator' ? '#ff4757' : '#5b6478'} className={step.id === 'indicator' ? '' : ''} />
        </svg>
      </div>

      {/* bounding box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35 }}
          className={`absolute border-2 rounded-md ${tone.border} ${tone.shadow}`}
          style={step.box}
        >
          {['-top-[3px] -left-[3px] border-t-2 border-l-2', '-top-[3px] -right-[3px] border-t-2 border-r-2', '-bottom-[3px] -left-[3px] border-b-2 border-l-2', '-bottom-[3px] -right-[3px] border-b-2 border-r-2'].map(
            (pos, idx) => (
              <span key={idx} className={`corner-bracket ${pos} ${tone.border} w-3.5 h-3.5`} />
            )
          )}
          <div className={`absolute -top-7 left-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-asphalt ${tone.text} ${tone.border} border whitespace-nowrap`}>
            {step.label} · {step.tag}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* bottom readout */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 border-t border-line bg-asphalt/70 backdrop-blur-sm z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between"
          >
            <span className={`font-mono text-xs ${tone.text}`}>{step.sub}</span>
            {step.verdict && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red/15 text-red border border-red/40">
                VIOLATION LOGGED
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
