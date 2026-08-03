import { motion } from 'framer-motion'
import { Fingerprint, ChevronRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TeamMemberCard({ member, index, onOpen }) {
  const hasSkills = Array.isArray(member.skills) && member.skills.length > 0

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(member)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      transition={{ delay: (index % 4) * 0.06 }}
      className="group relative text-left rounded-xl panel-border bg-panel p-5 hover:border-cyan/40 transition-colors overflow-hidden focus-visible:outline-2 focus-visible:outline-cyan"
    >
      {/* corner brackets, HUD style */}
      <span className="corner-bracket top-2 left-2 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="corner-bracket top-2 right-2 border-t-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 rounded-lg border border-cyan/30 bg-cyan/5 flex items-center justify-center overflow-hidden">
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display font-semibold text-cyan text-lg">{initials(member.name)}</span>
          )}
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green border border-asphalt" />
        </div>

        <div className="min-w-0">
          <h3 className="font-display font-medium text-[15px] text-text truncate">{member.name}</h3>
          <p className="font-mono text-xs text-amber mt-1 leading-snug">{member.designation}</p>
        </div>
      </div>

      {hasSkills && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="font-mono text-[10px] tracking-wide text-muted border border-line rounded px-1.5 py-0.5"
            >
              {s}
            </span>
          ))}
          {member.skills.length > 3 && (
            <span className="font-mono text-[10px] text-muted-2 px-1.5 py-0.5">
              +{member.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-muted-2">
        <span className="flex items-center gap-1.5">
          <Fingerprint size={12} className="text-cyan/70" />
          {String(index + 1).padStart(2, '0')} — VIEW FILE
        </span>
        <ChevronRight size={14} className="text-muted-2 group-hover:text-cyan group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.button>
  )
}
