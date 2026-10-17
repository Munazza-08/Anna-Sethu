import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">

          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <span>Anna <span className="text-orange">Sethu</span></span>
            </div>
            <p className="footer__tagline">
              Connecting food donors, NGOs and volunteers to ensure surplus food reaches people in need — reducing waste, fighting hunger.
            </p>
            <div className="footer__social">
              {['🌐','📘','🐦','📸'].map((icon, i) => (
                <button key={i} className="footer__social-btn" aria-label={`Social link ${i+1}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div className="footer__col">
            <h4 className="footer__heading">Platform</h4>
            <ul>
              <li><a href="#home"  className="footer__link">Home</a></li>
              <li><a href="#how"   className="footer__link">How It Works</a></li>
              <li><a href="#find"  className="footer__link">Find Food</a></li>
              <li><a href="#about" className="footer__link">About Us</a></li>
            </ul>
          </div>

          {/* Get Involved */}
          <div className="footer__col">
            <h4 className="footer__heading">Get Involved</h4>
            <ul>
              <li><a href="#" className="footer__link">Donate Food</a></li>
              <li><a href="#" className="footer__link">Join as NGO</a></li>
              <li><a href="#" className="footer__link">Become Volunteer</a></li>
              <li><a href="#" className="footer__link">Partner With Us</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer__col">
            <h4 className="footer__heading">Support</h4>
            <ul>
              <li><a href="#" className="footer__link">FAQ</a></li>
              <li><a href="#" className="footer__link">Contact Us</a></li>
              <li><a href="#" className="footer__link">Privacy Policy</a></li>
              <li><a href="#" className="footer__link">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} Anna Sethu. Made with ❤️ to fight hunger.
          </p>
          <div className="footer__badges">
            <span className="footer__badge footer__badge--orange">React + Vite</span>
            <span className="footer__badge footer__badge--green">Node.js + MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
