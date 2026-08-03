import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import {
  X, GraduationCap, Briefcase, Wrench, Code2, Contact, Mail, Link2, ScanLine,
} from 'lucide-react'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const linkMeta = {
  github: { Icon: Code2, label: 'GitHub' },
  linkedin: { Icon: Contact, label: 'LinkedIn' },
  email: { Icon: Mail, label: 'Email' },
  portfolio: { Icon: Link2, label: 'Portfolio' },
}

export default function TeamMemberModal({ member, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = member ? 'hidden' : ''
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [member, onClose])

  const hasEducation = Array.isArray(member?.education) && member.education.length > 0
  const hasExperience = Array.isArray(member?.experience) && member.experience.length > 0
  const contributions = member
    ? Array.isArray(member.contribution)
      ? member.contribution
      : member.contribution
        ? [member.contribution]
        : []
    : []
  const hasSkills = Array.isArray(member?.skills) && member.skills.length > 0
  const links = member?.links
    ? Object.entries(member.links).filter(([k, v]) => v && linkMeta[k])
    : []

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-asphalt/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${member.name} profile`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl panel-border bg-panel-2 mt-14 sm:mt-0"
          >
            {/* scan sweep accent */}
            <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan/70 to-transparent animate-dash-flow" />
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 h-8 w-8 rounded-md border border-line flex items-center justify-center text-muted hover:text-cyan hover:border-cyan/40 transition-colors z-10"
            >
              <X size={16} />
            </button>

            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 font-mono text-[11px] text-cyan mb-6">
                <ScanLine size={12} className="animate-blink-pulse" />
                PERSONNEL FILE
              </div>

              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-lg border border-cyan/30 bg-cyan/5 flex items-center justify-center overflow-hidden">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display font-semibold text-cyan text-xl">{initials(member.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-xl sm:text-2xl text-text">{member.name}</h2>
                  <p className="font-mono text-sm text-amber mt-1">{member.designation}</p>
                </div>
              </div>

              {member.bio && (
                <p className="mt-5 text-sm text-muted leading-relaxed border-l-2 border-line pl-4">
                  {member.bio}
                </p>
              )}

              {hasEducation && (
                <section className="mt-7">
                  <h3 className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-2 uppercase mb-3">
                    <GraduationCap size={13} className="text-cyan" /> Education
                  </h3>
                  <ul className="space-y-2">
                    {member.education.map((ed, i) => (
                      <li key={i} className="rounded-md panel-border bg-panel px-3 py-2 text-sm">
                        <span className="text-text">{ed.degree}</span>
                        {ed.institute && <span className="text-muted"> — {ed.institute}</span>}
                        {ed.year && <span className="block font-mono text-[11px] text-muted-2 mt-0.5">{ed.year}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {hasExperience && (
                <section className="mt-7">
                  <h3 className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-2 uppercase mb-3">
                    <Briefcase size={13} className="text-amber" /> Experience
                  </h3>
                  <ul className="space-y-2">
                    {member.experience.map((ex, i) => (
                      <li key={i} className="rounded-md panel-border bg-panel px-3 py-2 text-sm">
                        <span className="text-text">{ex.role}</span>
                        {ex.org && <span className="text-muted"> — {ex.org}</span>}
                        {ex.duration && <span className="block font-mono text-[11px] text-muted-2 mt-0.5">{ex.duration}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {contributions.length > 0 && (
                <section className="mt-7">
                  <h3 className="font-mono text-xs tracking-widest text-muted-2 uppercase mb-3">
                    Project Contribution
                  </h3>
                  <ul className="space-y-2">
                    {contributions.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted leading-relaxed">
                        <span className="text-cyan mt-0.5">▸</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {hasSkills && (
                <section className="mt-7">
                  <h3 className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-2 uppercase mb-3">
                    <Wrench size={13} className="text-cyan" /> Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[11px] text-cyan border border-cyan/30 bg-cyan/5 rounded-full px-2.5 py-1"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {links.length > 0 && (
                <section className="mt-8 pt-5 border-t border-line flex flex-wrap gap-3">
                  {links.map(([key, value]) => {
                    const { Icon, label } = linkMeta[key]
                    const href = key === 'email' ? `mailto:${value}` : value
                    return (
                      <a
                        key={key}
                        href={href}
                        target={key === 'email' ? undefined : '_blank'}
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-cyan transition-colors"
                      >
                        <Icon size={13} /> {label}
                      </a>
                    )
                  })}
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
