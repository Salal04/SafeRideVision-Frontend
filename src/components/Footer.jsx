import { Link } from 'react-router-dom'
import { ScanLine, Cpu } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-asphalt-2">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ScanLine size={16} className="text-cyan" />
            <span className="font-display font-semibold">Safe Ride Vision</span>
          </div>
          <p className="text-sm text-muted max-w-xs leading-relaxed">
            A computer-vision pipeline that watches how riders signal — detecting,
            tracking, and verifying turn-indicator compliance frame by frame.
          </p>
        </div>

        <div className="font-mono text-sm">
          <p className="text-muted-2 mb-3 uppercase tracking-wider text-xs">Pipeline</p>
          <ul className="space-y-2 text-muted">
            <li>YOLO — Detection</li>
            <li>DeepSORT — Tracking</li>
            <li>Orientation Model</li>
            <li>Indicator Classifier</li>
            <li>ResNet + LSTM — Blink Verdict</li>
          </ul>
        </div>

        <div className="font-mono text-sm">
          <p className="text-muted-2 mb-3 uppercase tracking-wider text-xs">Navigate</p>
          <ul className="space-y-2">
            <li><Link to="/" className="text-muted hover:text-cyan transition-colors">Home</Link></li>
            <li><Link to="/working" className="text-muted hover:text-cyan transition-colors">How It Works</Link></li>
            <li><Link to="/upload" className="text-muted hover:text-cyan transition-colors">Run Detection</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line-soft">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-2 font-mono">
          <span>© {new Date().getFullYear()} Safe Ride Vision — Final Year Project</span>
          <span className="flex items-center gap-1.5">
            <Cpu size={13} /> Built with YOLO · DeepSORT · PyTorch
          </span>
        </div>
      </div>
    </footer>
  )
}
