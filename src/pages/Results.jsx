import { motion } from 'framer-motion'
import { FileVideo, Sparkles } from 'lucide-react'
import results from '../data/results.js'
import BoxLegend from '../components/BoxLegend.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

function VideoPane({ label, tone, src, poster }) {
  const toneClasses =
    tone === 'amber'
      ? 'text-amber border-amber/30 bg-amber/5'
      : 'text-cyan border-cyan/30 bg-cyan/5'

  return (
    <div className="flex-1 min-w-0">
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide border rounded-full px-2.5 py-1 mb-2 ${toneClasses}`}
      >
        <FileVideo size={12} />
        {label}
      </span>
      <div className="rounded-lg overflow-hidden border border-line bg-asphalt-2 aspect-video">
        {src ? (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-2 text-xs font-mono">
            no video
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({ item, index }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      transition={{ delay: (index % 4) * 0.06 }}
      className="rounded-xl panel-border bg-panel p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display font-medium text-[15px] sm:text-base">{item.name}</h3>
          {item.description ? (
            <p className="text-sm text-muted leading-relaxed mt-1 max-w-2xl">{item.description}</p>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-muted-2 shrink-0 mt-1">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <VideoPane label="ORIGINAL" tone="cyan" src={item.original} poster={item.poster} />
        <VideoPane label="PROCESSED OUTPUT" tone="amber" src={item.output} />
      </div>
    </motion.div>
  )
}

export default function Results() {
  return (
    <div className="relative">
      {/* HEADER */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 bg-radial-glow overflow-hidden">
        <div className="absolute inset-0 hud-grid-bg opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 font-mono text-xs text-cyan border border-cyan/30 bg-cyan/5 rounded-full px-3 py-1.5 mb-6">
              <Sparkles size={13} />
              SEE IT IN ACTION
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.05] tracking-tight">
              Original footage, side by side with the{' '}
              <span className="text-amber text-glow-amber">verdict</span>
            </h1>
            <p className="mt-6 text-muted text-base sm:text-lg leading-relaxed">
              A few real clips run through the full pipeline \u2014 the raw input on the
              left, the annotated, verdict-ready output on the right.
            </p>
          </motion.div>
        </div>
      </section>

      {/* RESULTS LIST */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24 sm:pb-28">
        <BoxLegend /> 
        {results && results.length > 0 ? (
          <div className="grid gap-6">
            {results.map((item, idx) => (
              <ResultCard key={item.id} item={item} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted font-mono text-sm py-16">
            No sample results yet \u2014 add entries in src/data/results.js
          </div>
        )}
      </section>
    </div>
  )
}
