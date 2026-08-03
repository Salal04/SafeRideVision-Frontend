import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bike, Crosshair, Radar, SignpostBig, History, BrainCircuit,
  ArrowRight, ShieldCheck, Video, Sparkles,
} from 'lucide-react'
import DetectionHUD from '../components/DetectionHUD.jsx'
import ResultsShowcase from '../components/ResultsShowcase.jsx'
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

const features = [
  {
    icon: Crosshair,
    tone: 'cyan',
    title: 'Bike Detection',
    desc: 'A YOLO detector locates every motorbike in the frame, in real riding conditions and traffic clutter.',
  },
  {
    icon: Radar,
    tone: 'cyan',
    title: 'Multi-Bike Tracking',
    desc: 'DeepSORT assigns and holds a stable ID per bike across frames, so nothing is lost or confused mid-scene.',
  },
  {
    icon: Bike,
    tone: 'amber',
    title: 'Mirror Detection',
    desc: 'A dedicated model locates side mirrors, anchoring where indicator lights should be found on the bike body.',
  },
  {
    icon: SignpostBig,
    tone: 'amber',
    title: 'Indicator Detection',
    desc: 'The turn-signal lamp is detected on every frame, feeding a raw on/off reading into the pipeline.',
  },
  {
    icon: Sparkles,
    tone: 'cyan',
    title: 'Orientation Model',
    desc: 'Learns how a bike looks side-on versus front-on, so a side-to-front shift is read correctly as a turn.',
  },
  {
    icon: History,
    tone: 'amber',
    title: 'Indicator History',
    desc: 'Every frame\u2019s indicator reading is logged per bike, building the sequence the blink model needs.',
  },
  {
    icon: BrainCircuit,
    tone: 'cyan',
    title: 'ResNet + LSTM Blink Detector',
    desc: 'Reads the indicator history as a sequence and decides whether the light is actually blinking, not just lit or reflecting glare.',
  },
  {
    icon: ShieldCheck,
    tone: 'amber',
    title: 'Compliance Verdict',
    desc: 'Combines the turn with the blink state to flag whether the rider signalled before turning \u2014 frame-accurate, bike by bike.',
  },
]

const stats = [
  { value: '8', label: 'Model Stages' },
  { value: 'N-Bike', label: 'Simultaneous Tracking' },
  { value: 'Frame', label: 'Level Logging' },
  { value: 'ResNet+LSTM', label: 'Sequence Verdict' },
]

export default function Home() {
  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-radial-glow overflow-hidden">
        <div className="absolute inset-0 hud-grid-bg opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 font-mono text-xs text-cyan border border-cyan/30 bg-cyan/5 rounded-full px-3 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-blink-pulse" />
              RIDER SAFETY · COMPUTER VISION
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Does the rider <span className="text-amber text-glow-amber">signal</span>,
              or just <span className="text-cyan text-glow-cyan">turn</span>?
            </h1>
            <p className="mt-6 text-muted text-base sm:text-lg leading-relaxed max-w-xl">
              Safe Ride Vision watches bike footage the way a careful traffic officer would \u2014
              detecting every bike, tracking it, reading its turn, and checking whether the
              indicator was actually blinking before the turn happened.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/upload"
                className="group inline-flex items-center gap-2 rounded-md bg-amber text-asphalt font-semibold px-5 py-3 hover:bg-amber-dim hover:text-text transition-colors"
              >
                <Video size={18} />
                Run Detection on a Video
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/working"
                className="inline-flex items-center gap-2 rounded-md border border-line px-5 py-3 font-medium text-text hover:border-cyan/50 hover:text-cyan transition-colors"
              >
                See the Pipeline
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="panel-border rounded-lg bg-panel px-3 py-3">
                  <div className="font-mono text-cyan text-sm sm:text-base font-semibold">{s.value}</div>
                  <div className="text-[11px] text-muted-2 mt-1 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="animate-float-slow"
          >
            <DetectionHUD />
            <p className="mt-3 text-center font-mono text-[11px] text-muted-2">
              simulated readout \u2014 live output on the Run Detection page
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="max-w-2xl mb-14"
        >
          <span className="font-mono text-xs text-amber tracking-widest">SAFETY MEASURES</span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3 tracking-tight">
            Every safeguard a rider needs, checked automatically
          </h2>
          <p className="text-muted mt-4 leading-relaxed">
            Eight cooperating models cover detection, tracking, orientation and signal
            behaviour \u2014 so a single system can answer the one question that matters:
            did the rider signal their turn?
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, idx) => {
            const Icon = f.icon
            const toneClasses = f.tone === 'amber'
              ? 'text-amber border-amber/30 bg-amber/5'
              : 'text-cyan border-cyan/30 bg-cyan/5'
            return (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ delay: (idx % 4) * 0.06 }}
                className="group relative rounded-xl panel-border bg-panel p-5 hover:border-line-soft transition-colors overflow-hidden"
              >
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center mb-4 ${toneClasses}`}>
                  <Icon size={18} />
                </div>
                <h3 className="font-display font-medium text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                <span className="absolute top-4 right-4 font-mono text-[10px] text-muted-2">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* PIPELINE TEASER */}
      <section className="border-y border-line bg-panel/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="font-mono text-xs text-cyan tracking-widest">FROM PIXELS TO A VERDICT</span>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3 tracking-tight">
              One continuous pipeline, frame by frame
            </h2>
            <p className="text-muted mt-4 leading-relaxed max-w-md">
              Detection feeds tracking, tracking feeds orientation and indicator reading,
              and every reading is remembered until the LSTM has enough history to decide.
              Walk through exactly how it happens.
            </p>
            <Link
              to="/working"
              className="mt-7 inline-flex items-center gap-2 text-cyan font-mono text-sm hover:gap-3 transition-all"
            >
              Explore the full pipeline <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-mono text-xs sm:text-sm"
          >
            <div className="rounded-xl panel-border bg-asphalt p-5 space-y-3">
              {[
                'INPUT_FRAME        \u2192 t=0.00s',
                'YOLO_DETECT        \u2192 bike[3] found',
                'DEEPSORT_TRACK     \u2192 id assigned: 042',
                'ORIENTATION_MODEL  \u2192 side \u2192 front',
                'INDICATOR_DETECT   \u2192 lamp state: ON',
                'HISTORY_BUFFER     \u2192 [0,0,1,1,0,1,...]',
                'LSTM_BLINK_MODEL   \u2192 blinking: TRUE',
                'VERDICT            \u2192 SIGNAL OK \u2713',
              ].map((line, i) => (
                <div key={i} className="flex items-center gap-3 text-muted">
                  <span className="text-muted-2">{String(i).padStart(2, '0')}</span>
                  <span className={i === 7 ? 'text-green' : ''}>{line}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 sm:py-28 text-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight">
            Upload a ride. <span className="text-amber">Get a verdict.</span>
          </h2>
          <p className="text-muted mt-4 max-w-xl mx-auto leading-relaxed">
            Drop in footage and the pipeline runs end to end \u2014 you get back an annotated
            video and a per-bike compliance log.
          </p>
          <Link
            to="/upload"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-cyan text-asphalt font-semibold px-6 py-3.5 hover:opacity-90 transition-opacity"
          >
            <Video size={18} />
            Go to Run Detection
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
