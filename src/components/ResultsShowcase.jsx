import { motion } from 'framer-motion'
import { FileVideo, Sparkles } from 'lucide-react'
import results from '../data/results.js'

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

export default function ResultsShowcase() {
  if (!results || results.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        className="max-w-2xl mb-14"
      >
        <span className="inline-flex items-center gap-2 font-mono text-xs text-cyan tracking-widest">
          <Sparkles size={14} />
          SEE IT IN ACTION
        </span>
        <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3 tracking-tight">
          Original footage, side by side with the verdict
        </h2>
        <p className="text-muted mt-4 leading-relaxed">
          A few real clips run through the full pipeline \u2014 the raw input on the left,
          the annotated, verdict-ready output on the right.
        </p>
      </motion.div>

      <div className="grid gap-6">
        {results.map((item, idx) => (
          <ResultCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </section>
  )
}
