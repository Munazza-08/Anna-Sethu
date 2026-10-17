import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

/**
 * Navbar — Orange + Green + White theme
 * Sticky top bar with glassmorphism scroll effect.
 */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="navigation">
      <div className="navbar__container container">

        {/* Logo */}
        <Link to="/" className="navbar__logo" id="nav-logo" aria-label="Anna Sethu home">
          <div className="navbar__logo-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M18.6 3.6C17 2 14.9 1 12.6 1 10.1 1 7.8 2.1 6.2 4L5 5.4l1.3 1.3C5.5 7.8 5 9.1 5 10.5c0 4.1 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5c0-1.5-.5-2.9-1.2-4.1L20 5.2l-1.4-1.6zm-6 12.9c-3.3 0-6-2.7-6-6 0-1.1.3-2.2.9-3.1l9.2 9.2c-.9.6-2.6.9-4.1-.1zM15.1 7L6 16.1c-.6-.9-.9-2-.9-3.1 0-3.3 2.7-6 6-6 1.1 0 2.2.3 3.1.9L15.1 7z"/>
            </svg>
          </div>
          <span className="navbar__logo-text">
            Anna <span className="text-orange">Sethu</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="navbar__links" aria-label="Main navigation">
          <li><a href="#home"  className="navbar__link navbar__link--active">Home</a></li>
          <li><a href="#how"   className="navbar__link">How It Works</a></li>
          <li><a href="#find"  className="navbar__link">Find Food</a></li>
          <li><a href="#about" className="navbar__link">About Us</a></li>
        </ul>

        {/* CTA Actions */}
        <div className="navbar__actions">
          <button className="btn btn-ghost navbar__signin" id="btn-signin" onClick={() => navigate('/auth')}>
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            Sign In
          </button>
          <button className="btn btn-primary navbar__donate" id="btn-donate-nav" onClick={() => navigate('/auth')}>
            🍱 &nbsp;Donate Food
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          id="btn-hamburger"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu" role="navigation" aria-label="Mobile navigation">
          <a href="#home"  className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>🏠 Home</a>
          <a href="#how"   className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>📋 How It Works</a>
          <a href="#find"  className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>🔍 Find Food</a>
          <a href="#about" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>ℹ️ About Us</a>
          <div className="navbar__mobile-actions">
            <button className="btn btn-ghost w-full"    id="btn-signin-mobile"   onClick={() => { navigate('/auth'); setMenuOpen(false); }}>Sign In</button>
            <button className="btn btn-primary w-full"  id="btn-donate-mobile"   onClick={() => { navigate('/auth'); setMenuOpen(false); }}>🍱 Donate Food</button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
