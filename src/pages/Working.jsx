import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Video, GitBranch } from 'lucide-react'
import {
  DetectVisual, TrackVisual, MirrorVisual, IndicatorVisual,
  OrientationVisual, HistoryVisual, BlinkVisual, VerdictVisual,
} from '../components/StageVisual.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

const stages = [
  {
    n: '01',
    tag: 'DETECTION',
    title: 'Finding every bike in the frame',
    body: 'Each frame is passed through a YOLO object detector trained to find motorbikes. It returns a bounding box and a confidence score per bike, no matter how many are in frame or how cluttered the traffic is.',
    Visual: DetectVisual,
  },
  {
    n: '02',
    tag: 'TRACKING',
    title: 'Keeping identity across frames',
    body: 'A detector alone forgets who\u2019s who from one frame to the next. DeepSORT links each detection to a persistent track ID using motion and appearance, so "bike 042" stays "bike 042" for the whole clip \u2014 even with several bikes on screen at once.',
    Visual: TrackVisual,
  },
  {
    n: '03',
    tag: 'MIRROR DETECTION',
    title: 'Anchoring where the signal lives',
    body: 'A separate model locates the bike\u2019s side mirrors. Indicators sit close to the mirror housing, so this gives the pipeline a stable region of interest instead of searching the whole bike for a small blinking light.',
    Visual: MirrorVisual,
  },
  {
    n: '04',
    tag: 'INDICATOR DETECTION',
    title: 'Reading the turn signal, frame by frame',
    body: 'Within that region, the indicator lamp itself is detected and classified as on or off for the current frame. This raw, noisy, frame-level reading is the signal every later stage depends on.',
    Visual: IndicatorVisual,
  },
  {
    n: '05',
    tag: 'ORIENTATION MODEL',
    title: 'Recognising a turn as it happens',
    body: 'A bike photographed side-on is riding straight past the camera; one photographed more front-on has turned toward it. The orientation model is trained to tell these apart, so a side-to-front shift in a bike\u2019s track is read as "this bike just turned."',
    Visual: OrientationVisual,
  },
  {
    n: '06',
    tag: 'HISTORY BUFFER',
    title: 'Remembering every reading',
    body: 'A single frame can\u2019t tell you if a light is blinking \u2014 it can only tell you on or off. So every indicator reading is appended to a per-bike history buffer, building the exact sequence the next model needs to see.',
    Visual: HistoryVisual,
  },
  {
    n: '07',
    tag: 'BLINK DETECTOR',
    title: 'Telling a blink from a flicker',
    body: 'A ResNet backbone encodes each frame\u2019s visual features, and an LSTM reads the resulting sequence over time. Together they decide whether the indicator history really represents a genuine blink pattern \u2014 not glare, not a reflection, not a light left solidly on.',
    Visual: BlinkVisual,
  },
  {
    n: '08',
    tag: 'COMPLIANCE VERDICT',
    title: 'Turn plus blink equals the rule',
    body: 'The final check is simple to state and strict to enforce: if the orientation model says a bike turned, the blink detector\u2019s verdict for that window must say the indicator was blinking. Any turn without a confirmed blink is logged as a violation, tied to that bike\u2019s track ID and timestamp.',
    Visual: VerdictVisual,
  },
]

export default function Working() {
  return (
    <div className="pt-28">
      {/* Header */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 text-center">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <span className="inline-flex items-center gap-2 font-mono text-xs text-cyan border border-cyan/30 bg-cyan/5 rounded-full px-3 py-1.5 mb-6">
            <GitBranch size={12} /> THE FULL PIPELINE
          </span>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl tracking-tight">
            Eight stages, one question
          </h1>
          <p className="text-muted mt-5 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg">
            Every stage below runs on every frame of every bike track. Nothing is skipped \u2014
            detection feeds tracking, tracking feeds orientation and indicator readings, and the
            history they build up is what the blink model finally judges.
          </p>
        </motion.div>
      </section>

      {/* Pipeline */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 relative">
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-line -translate-x-1/2" />
        <div className="space-y-16 lg:space-y-24">
          {stages.map((s, idx) => {
            const reverse = idx % 2 === 1
            return (
              <motion.div
                key={s.n}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeUp}
                className={`relative grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${reverse ? '' : ''}`}
              >
                <div className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-asphalt border-2 border-cyan items-center justify-center font-mono text-xs text-cyan z-10`}
                     style={{ top: '50%', transform: 'translate(-50%, -50%)' }}>
                  {s.n}
                </div>

                <div className={reverse ? 'lg:order-2' : ''}>
                  <span className="font-mono text-xs text-amber tracking-widest">{s.tag}</span>
                  <div className="flex items-center gap-3 mt-2 lg:hidden mb-1">
                    <span className="font-mono text-xs text-cyan border border-cyan/40 rounded-full h-6 w-6 flex items-center justify-center">{s.n}</span>
                  </div>
                  <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-1 tracking-tight">
                    {s.title}
                  </h2>
                  <p className="text-muted mt-4 leading-relaxed">{s.body}</p>
                </div>

                <div className={reverse ? 'lg:order-1' : ''}>
                  <s.Visual />
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Rule explanation */}
      <section className="border-y border-line bg-panel/40">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="font-mono text-xs text-cyan tracking-widest">THE RULE, IN ONE LINE</span>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3 tracking-tight max-w-2xl mx-auto">
              A turn is only safe if the indicator was already blinking
            </h2>
            <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 font-mono text-sm">
              <span className="px-3 py-2 rounded-md border border-cyan/40 bg-cyan/5 text-cyan">orientation: side \u2192 front</span>
              <span className="text-muted">AND</span>
              <span className="px-3 py-2 rounded-md border border-line bg-panel text-muted">blink history window</span>
              <span className="text-muted">=</span>
              <span className="px-3 py-2 rounded-md border border-green/40 bg-green/5 text-green">signalled \u2713</span>
              <span className="text-muted-2">/</span>
              <span className="px-3 py-2 rounded-md border border-red/40 bg-red/5 text-red">violation \u26a0</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-20 text-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="font-display font-semibold text-3xl tracking-tight">See it run on your own footage</h2>
          <p className="text-muted mt-4">Upload a clip and watch every stage above produce a real, annotated result.</p>
          <Link
            to="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-amber text-asphalt font-semibold px-6 py-3.5 hover:bg-amber-dim hover:text-text transition-colors"
          >
            <Video size={18} /> Run Detection <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
