import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

// Simple motorbike glyph, reused from StageVisual's DetectVisual so the box
// color reads clearly against a consistent icon.
function BikeGlyph({ stroke }) {
  return (
    <svg viewBox="0 0 60 40" className="w-9 h-7" fill="none">
      <circle cx="14" cy="30" r="7" stroke={stroke} strokeWidth="2" />
      <circle cx="46" cy="30" r="7" stroke={stroke} strokeWidth="2" />
      <path d="M14 30 L30 15 L38 15 L46 30" stroke={stroke} strokeWidth="2" fill="none" />
    </svg>
  )
}

const LEGEND = [
  {
    key: 'straight',
    color: '#3ddc84', // theme --color-green
    label: 'Going Straight',
    caption: 'Green Color Shows: No turn detected \u2014 bike is riding straight on.',
  },
  {
    key: 'violation',
    color: '#ff4757', // theme --color-red
    label: 'Turning \u2014 Indicator OFF',
    caption: 'Red Color Shows: Bike is turning but the indicator was never blinking. Flagged as a violation.',
  },
  {
    key: 'compliant',
    color: '#000000',
    label: 'Turning \u2014 Indicator ON',
    caption: 'Black Color Shows: Bike is turning and the indicator was blinking beforehand. Signal used correctly.',
  },
]

export default function BoxLegend() {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      className="rounded-xl panel-border bg-panel p-5 sm:p-6 mb-10"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-blink-pulse" />
        <h3 className="font-mono text-xs tracking-widest text-muted-2 uppercase">
          Bounding Box Key
        </h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {LEGEND.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="rounded-lg border border-line bg-asphalt-2 p-4 flex flex-col gap-3"
          >
            <div
              className="relative h-16 rounded-md flex items-center justify-center"
              style={{
                border: `2px solid ${item.color}`,
                boxShadow:
                  item.color === '#000000'
                    ? '0 0 0 1px rgba(255,255,255,0.15), 0 0 14px rgba(255,255,255,0.08)'
                    : `0 0 14px ${item.color}55`,
                background: item.color === '#000000' ? 'rgba(255,255,255,0.03)' : `${item.color}0d`,
              }}
            >
              <BikeGlyph stroke={item.color === '#000000' ? '#e7ecf3' : item.color} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{
                    background: item.color,
                    boxShadow: item.color === '#000000' ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                  }}
                />
                <span className="font-mono text-[11px] sm:text-xs font-medium text-text">
                  {item.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted leading-relaxed">{item.caption}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
