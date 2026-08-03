import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Working from './pages/Working.jsx'
import Upload from './pages/Upload.jsx'
import Team from './pages/Team.jsx'
import Results from './pages/Results.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-asphalt">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/working" element={<Working />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/team" element={<Team />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
