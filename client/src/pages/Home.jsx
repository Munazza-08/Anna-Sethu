import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BACKEND_URL } from '../services/backend'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Home.css'

/* ─── How It Works data ─────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    id: 'donate',
    step: '01',
    icon: (
      <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
      </svg>
    ),
    title: 'Donate',
    description: 'Share your surplus food from homes, restaurants, hostels, events and more. Every meal counts.',
  },
  {
    id: 'connect',
    step: '02',
    icon: (
      <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
      </svg>
    ),
    title: 'Connect',
    description: 'NGOs find and request food donations based on their community needs and location in real-time.',
  },
  {
    id: 'deliver',
    step: '03',
    icon: (
      <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
      </svg>
    ),
    title: 'Deliver',
    description: 'Volunteers collect and deliver food to NGOs and beneficiaries, ensuring it reaches the right people.',
  },
]

/* ─── Impact stats ────────────────────────────────────────── */
const IMPACT = [
  { id: 'meals',      value: '1,250+', label: 'Meals Shared',   icon: '🍽️' },
  { id: 'donors',     value: '85',     label: 'Active Donors',  icon: '🤝' },
  { id: 'ngos',       value: '32',     label: 'NGO Partners',   icon: '🏛️' },
  { id: 'volunteers', value: '120+',   label: 'Volunteers',     icon: '🚴' },
]

/* ─── Stat cards for hero ─────────────────────────────────── */
const STATS = [
  { id: 'meals',  icon: '🍽️', value: '1,250+', label: 'Meals Shared' },
  { id: 'donors', icon: '🤝', value: '85',     label: 'Active Donors' },
  { id: 'ngos',   icon: '🏛️', value: '32',     label: 'NGO Partners' },
  { id: 'vols',   icon: '🚴', value: '120+',   label: 'Volunteers' },
]

/* ─── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Priya Ramesh',
    role: 'Restaurant Owner & Donor',
    avatar: '👩‍🍳',
    text: 'Anna Sethu helped me donate surplus food from my restaurant every weekend. Knowing it goes to people in need instead of the bin is incredibly fulfilling.',
  },
  {
    id: 2,
    name: 'Rajan Kumar',
    role: 'NGO Coordinator',
    avatar: '🏥',
    text: 'As an NGO, we struggled to find consistent food sources. Anna Sethu connected us with donors and made logistics simple. We now serve 200+ meals daily.',
  },
  {
    id: 3,
    name: 'Aisha Begum',
    role: 'Volunteer',
    avatar: '🛵',
    text: 'I deliver food 3 times a week. The platform is easy to use and the feeling of making a difference in my community keeps me motivated every day.',
  },
]

/**
 * Home — Landing page with Orange + Green + White theme
 */
function Home() {
  const [serverStatus, setServerStatus] = useState(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const navigate = useNavigate()

  /* Check backend health */
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/health`)
      .then(r => r.json())
      .then(data => setServerStatus(data))
      .catch(() => setServerStatus({ success: false, message: 'Backend not connected' }))
  }, [])

  /* Auto-rotate testimonials every 5s */
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="page home-page">
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section className="hero" id="home" aria-label="Hero">
        {/* Background decoration */}
        <div className="hero__bg-dots" aria-hidden="true" />
        <div className="hero__bg-blob hero__bg-blob--coral" aria-hidden="true" />
        <div className="hero__bg-blob hero__bg-blob--teal"  aria-hidden="true" />
        {/* Decorative rectangles like in the reference image */}
        <div className="hero__deco-rect hero__deco-rect--tl" aria-hidden="true" />
        <div className="hero__deco-rect hero__deco-rect--tr" aria-hidden="true" />
        <div className="hero__deco-rect hero__deco-rect--br" aria-hidden="true" />

        <div className="container hero__container">

          {/* Left — Text */}
          <div className="hero__content">
            <div className="badge badge-orange animate-fadeInUp">
              🍱 &nbsp;Food Donation &amp; Redistribution Platform
            </div>

            <h1 className="hero__title">
              Good food deserves
              <em>another table.</em>
              <span className="hero__title-underline" aria-hidden="true" />
            </h1>

            <p className="hero__subtitle">
              Anna Sethu connects food donors, NGOs and volunteers to ensure
              surplus food reaches people in need — reducing waste and fighting hunger.
            </p>

            <div className="hero__actions">
              <button className="btn btn-primary hero__btn-donate" id="btn-hero-donate" onClick={() => navigate('/auth')}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                Donate Surplus Food →
              </button>
              <button className="hero__btn-find" id="btn-hero-find" onClick={() => navigate('/auth')}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"/>
                </svg>
                Join as Volunteer
              </button>
            </div>

            {/* Stats strip */}
            <div className="hero__stats" role="list">
              {STATS.map(s => (
                <div key={s.id} className="hero__stat" role="listitem">
                  <div className="hero__stat-icon" aria-hidden="true">{s.icon}</div>
                  <div>
                    <strong className="hero__stat-value">{s.value}</strong>
                    <span className="hero__stat-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Donation Illustration */}
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__card">
              <div className="hero__card-image">
                {/* Real donation illustration image */}
                <img
                  src="/donation-illustration.jpg"
                  alt="People donating food boxes to community"
                  className="hero__illustration"
                />
                <div className="hero__card-overlay">
                  <p className="hero__card-quote">
                    "Good Food<br />
                    <span>Better Tomorrow"</span>
                  </p>
                </div>
              </div>
              <div className="hero__activity">
                <span className="hero__activity-dot" />
                <span>Live: 3 donations available near you</span>
              </div>
            </div>

            {/* Floating badges */}
            <div className="hero__float hero__float--top">
              ✅ &nbsp;Donation Posted!
            </div>
            <div className="hero__float hero__float--bottom">
              🚴 &nbsp;Volunteer on the way
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ IMPACT STRIP ══════════ */}
      <div className="impact-strip" aria-label="Impact statistics">
        <div className="impact-strip__inner container">
          {IMPACT.map(item => (
            <div key={item.id} className="impact-strip__item">
              <span className="impact-strip__value">{item.value}</span>
              <span className="impact-strip__label">{item.icon} &nbsp;{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="section how-it-works" id="how" aria-labelledby="how-heading">
        <div className="container">
          <div className="section-header">
            <div className="divider"><span>🤝</span></div>
            <h2 className="section-title" id="how-heading">
              Food finds its way when<br />
              <span className="text-coral">we work together</span>
            </h2>
            <p className="section-subtitle">
              A simple three-step process that connects surplus food to the people who need it most.
            </p>
          </div>

          <div className="how-it-works__grid stagger">
            {HOW_IT_WORKS.map(step => (
              <div key={step.id} className="how-it-works__card animate-fadeInUp">
                <span className="how-it-works__step">{step.step}</span>
                <div className="how-it-works__icon-wrap" aria-hidden="true">
                  {step.icon}
                </div>
                <h3 className="how-it-works__title">{step.title}</h3>
                <p className="how-it-works__desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="section testimonials" id="about" aria-labelledby="testimonials-heading">
        <div className="container">
          <div className="section-header">
            <div className="divider"><span>💬</span></div>
            <h2 className="section-title" id="testimonials-heading">
              Voices from our <span className="text-teal">community</span>
            </h2>
            <p className="section-subtitle">
              Real stories from donors, NGOs, and volunteers making a difference every day.
            </p>
          </div>

          <div className="testimonials__wrapper" role="region" aria-label="Testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.id}
                className={`testimonials__card ${i === activeTestimonial ? 'active' : ''}`}
                aria-hidden={i !== activeTestimonial}
              >
                <span className="testimonials__quote-icon">"</span>
                <p className="testimonials__text">"{t.text}"</p>
                <div className="testimonials__author">
                  <div className="testimonials__avatar" aria-hidden="true">{t.avatar}</div>
                  <div>
                    <strong className="testimonials__name">{t.name}</strong>
                    <span className="testimonials__role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot navigation */}
          <div className="testimonials__dots" role="tablist" aria-label="Testimonial navigation">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`testimonials__dot ${i === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(i)}
                aria-label={`Testimonial ${i + 1}`}
                aria-selected={i === activeTestimonial}
                role="tab"
                id={`dot-${i}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="cta-banner" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-banner__content">
            <h2 className="cta-banner__title" id="cta-heading">
              Ready to make a <span>difference?</span>
            </h2>
            <p className="cta-banner__subtitle">
              Join 1,250+ donors, NGOs, and volunteers already using Anna Sethu to fight hunger in our communities.
            </p>
            <div className="cta-banner__actions">
              <button className="cta-banner__btn-white" id="btn-cta-donate">
                🍱 &nbsp;Start Donating Today
              </button>
              <button className="cta-banner__btn-outline" id="btn-cta-ngo">
                🏛️ &nbsp;Register as NGO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SERVER STATUS (Dev helper) ══════════ */}
      <div className="server-status" role="status" aria-live="polite">
        <div className="container">
          <div className={`server-status__pill ${serverStatus?.success ? 'connected' : 'disconnected'}`}>
            <span className="server-status__dot" aria-hidden="true" />
            <span>
              Backend:{' '}
              {serverStatus
                ? serverStatus.success
                  ? `✅ ${serverStatus.message}`
                  : `❌ ${serverStatus.message}`
                : '⏳ Connecting...'}
            </span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Home
