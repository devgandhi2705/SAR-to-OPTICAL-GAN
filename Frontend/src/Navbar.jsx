import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <span className="nav-logo-icon">🛰️</span>
        <span className="nav-logo-text">SAR GAN</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/demo" className={`nav-link nav-demo-link ${location.pathname === '/demo' ? 'active' : ''}`}>
          Live Demo
        </Link>
        <a
          href="https://github.com/devgandhi2705/SAR-to-OPTICAL-GAN"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link nav-github-link"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  )
}

export default Navbar
