import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ScanLine, Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/working', label: 'How It Works' },
  { to: '/results', label: 'Results' },
  { to: '/upload', label: 'Run Detection' },
  { to: '/Team', label: 'Team' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-asphalt/85 backdrop-blur-md border-b border-line' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-cyan/40 bg-cyan/5">
            <ScanLine size={16} className="text-cyan" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber animate-blink-pulse" />
          </span>
          <span className="font-display font-semibold tracking-tight text-[15px] sm:text-base">
            Safe Ride <span className="text-cyan">Vision</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-medium rounded-md transition-colors font-mono tracking-wide ${
                  isActive ? 'text-cyan' : 'text-muted hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="text-[11px] text-muted-2 mr-1">{'//'}</span>
                  {l.label}
                  {isActive && (
                    <span className="absolute left-3 right-3 -bottom-[1px] h-[2px] bg-cyan rounded-full shadow-[0_0_8px_rgba(47,230,217,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <Link
            to="/upload"
            className="ml-3 inline-flex items-center gap-2 rounded-md bg-amber text-asphalt font-semibold text-sm px-4 py-2 hover:bg-amber-dim hover:text-text transition-colors"
          >
            Try It
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-text"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-asphalt border-t border-line px-5 pb-5 pt-2 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-3 rounded-md text-sm font-mono ${isActive ? 'text-cyan bg-panel' : 'text-muted'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
