import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import team from '../data/team.js'
import TeamMemberCard from '../components/TeamMemberCard.jsx'
import TeamMemberModal from '../components/TeamMemberModal.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function Team() {
  const [active, setActive] = useState(null)

  return (
    <div className="relative">
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 bg-radial-glow overflow-hidden">
        <div className="absolute inset-0 hud-grid-bg opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 font-mono text-xs text-cyan border border-cyan/30 bg-cyan/5 rounded-full px-3 py-1.5 mb-6">
              <Users size={13} />
              PROJECT TEAM
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.05] tracking-tight">
              The people behind <span className="text-cyan text-glow-cyan">Safe Ride Vision</span>
            </h1>
            <p className="mt-6 text-muted text-base sm:text-lg leading-relaxed">
              Click on any team member to open their file — education, past experience,
              and exactly what they built on this project.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24 sm:pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((member, i) => (
            <TeamMemberCard key={member.id} member={member} index={i} onOpen={setActive} />
          ))}
        </div>
      </section>

      <TeamMemberModal member={active} onClose={() => setActive(null)} />
    </div>
  )
}
