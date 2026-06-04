import { Component, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CinematicStage from './CinematicStage';
import HeroOrbScene from './HeroOrbScene';
import WorkflowFinaleScene from './WorkflowFinaleScene';
import WorkflowFinaleFallback from './WorkflowFinaleFallback';
import '../styles/landing-premium.css';

class ThreeErrorBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const navLinks = [
  { href: '#platform', label: 'Platform' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#intelligence', label: 'Intelligence' },
  { href: '#workflow', label: 'Workflow' },
];

const heroCards = [
  {
    tag: 'MONITOR WORKFLOW',
    title: 'Live BOQ watch',
    copy: 'Track quantity drift across drawing revisions in one command view.',
    icon: '◈',
  },
  {
    tag: 'VERIFY',
    title: 'CAD + cost signals',
    copy: 'Cross-check geometry takeoff with rate libraries and AI-assisted QA.',
    icon: '◎',
  },
  {
    tag: 'ORCHESTRATE',
    title: 'Project OS',
    copy: 'Upload, extract, estimate, and export from a single QS workspace.',
    icon: '⬡',
  },
];

const chapters = [
  { step: '01', kicker: 'Spatial intelligence', title: 'Your project, as a living system.', copy: 'Every quantity, revision, and cost signal is brought together in one precise visual workspace.', elements: '5,842', confidence: '98.6%' },
  { step: '02', kicker: 'Layered clarity', title: 'Break complexity into signal.', copy: 'Drawings, live BOQ data, and project controls separate into a clear, inspectable hierarchy.', elements: '4,210', confidence: '97.2%' },
  { step: '03', kicker: 'Real-time orchestration', title: 'See intelligence move.', copy: 'AI modules connect context across design, takeoff, estimation, and delivery as your project evolves.', elements: '6,118', confidence: '99.1%' },
  { step: '04', kicker: 'One calm command center', title: 'Everything returns to focus.', copy: 'A platform built for confident decisions from first drawing to final account.', elements: '5,842', confidence: '98.6%' },
];

const features = [
  { tag: 'VISION', title: 'Drawing intelligence', copy: 'Turn dense architectural files into an organized, queryable source of truth.' },
  { tag: 'TAKEOFF', title: 'Measured with context', copy: 'Trace quantities back to the geometry and layer that produced them.' },
  { tag: 'FORECAST', title: 'Cost signals, early', copy: 'Understand the effect of each revision before it becomes expensive.' },
];

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StaticOrb() {
  return (
    <div className="static-orb" aria-hidden="true">
      <span className="static-orb__ring static-orb__ring--cyan" />
      <span className="static-orb__ring static-orb__ring--magenta" />
      <span className="static-orb__core" />
    </div>
  );
}

function StaticStageModel() {
  return (
    <div className="static-stage-model" aria-hidden="true">
      <div className="static-stage-board">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

const orbTooltips = [
  { className: 'orb-tooltip--tl', tag: 'LIVE WATCH', title: 'BOQ sync', detail: 'Quantities update with CAD' },
  { className: 'orb-tooltip--tr', tag: 'VERIFY', title: '3D twin', detail: 'DWG-linked preview' },
  { className: 'orb-tooltip--bl', tag: 'EXTRACT', title: 'CAD engine', detail: 'Walls, slabs, openings' },
  { className: 'orb-tooltip--br', tag: 'AI READY', title: 'QS assistant', detail: 'OpenAI + local guide' },
];

function chapterProgress(index: number) {
  const maxIndex = chapters.length - 1;
  return maxIndex > 0 ? index / maxIndex : 0;
}

export default function PremiumLandingPage() {
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const selectChapter = (index: number) => {
    const clamped = Math.max(0, Math.min(chapters.length - 1, index));
    setActiveChapter(clamped);
    setProgress(chapterProgress(clamped));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement | HTMLDivElement>) => {
    setPointer({
      x: (event.clientX / window.innerWidth - 0.5) * 2,
      y: -(event.clientY / window.innerHeight - 0.5) * 2,
    });
  };

  return (
    <main className="cinematic-landing sentra-landing">
      <div className="sentra-bg-rings" aria-hidden="true" />
      <div className="sentra-bg-dots" aria-hidden="true" />

      <header className="cinematic-nav sentra-nav">
        <div className="sentra-container sentra-nav__inner">
          <Link className="cinematic-brand sentra-brand" to="/">
            <img className="custom-logo-filter" src="/logo.png" alt="Dee Bug" />
          </Link>
          <nav className="sentra-nav-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>
          <Link className="nav-cta sentra-nav-cta" to="/dashboard">
            Launch workspace <Arrow />
          </Link>
        </div>
      </header>

      <section className="sentra-section sentra-section--nav-offset sentra-hero">
        <div className="sentra-container">
          <div
            className="sentra-split sentra-hero__grid"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setPointer({ x: 0, y: 0 })}
          >
            <div className="sentra-stack sentra-hero__copy sentra-hero-animate">
              <span className="sentra-pill">Intelligence for the built world</span>
              <h1 className="sentra-heading-xl">
                See the whole project.
                <span className="sentra-hero__accent">Before it is built.</span>
              </h1>
              <p className="sentra-body-lg">
                A spatial intelligence platform for quantity surveying — drawings, BOQ, cost, and AI in one command center.
              </p>
              <div className="sentra-actions">
                <Link className="sentra-btn sentra-btn--primary" to="/upload">
                  Start a project <Arrow />
                </Link>
                <a className="sentra-btn sentra-btn--ghost" href="#capabilities">
                  Explore platform
                </a>
              </div>
            </div>

            <div className="sentra-visual sentra-hero__visual">
              <div className="sentra-orb-glow" aria-hidden="true" />
              <div className="sentra-orb-canvas">
                <ThreeErrorBoundary fallback={<StaticOrb />}>
                  <HeroOrbScene pointer={pointer} />
                </ThreeErrorBoundary>
              </div>
              {orbTooltips.map((tip) => (
                <div key={tip.tag} className={`orb-tooltip ${tip.className}`}>
                  <span className="orb-tooltip__tag">{tip.tag}</span>
                  <strong>{tip.title}</strong>
                  <small>{tip.detail}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="sentra-section">
        <div className="sentra-container">
          <div className="sentra-card-grid">
            {heroCards.map((card, index) => (
              <motion.article
                key={card.tag}
                className="sentra-cap-card"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                <span className="sentra-cap-card__icon" aria-hidden="true">{card.icon}</span>
                <p className="sentra-cap-card__tag">{card.tag}</p>
                <h3>{card.title}</h3>
                <small>{card.copy}</small>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="sentra-section">
        <div className="sentra-container">
          <div
            className="sentra-split sentra-platform-grid"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setPointer({ x: 0, y: 0 })}
          >
            <div className="sentra-stack sentra-platform-copy">
              <header className="sentra-stack sentra-platform-intro">
                <span className="sentra-pill">Platform</span>
                <h2 className="sentra-heading-xl">
                  Spatial intelligence
                  <span className="sentra-hero__accent">in motion.</span>
                </h2>
                <p className="sentra-body-lg">
                  Explore four layers of the DaiBoq workspace — from drawing intake to a single command view.
                </p>
              </header>

              <div className="sentra-platform-chapter">
                <div className="sentra-stage-chapters">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.step} className={`sentra-stage-chapter ${activeChapter === index ? 'is-active' : ''}`}>
                      <p className="sentra-step-label">{chapter.step} / {chapter.kicker}</p>
                      <h3 className="sentra-heading-md">{chapter.title}</h3>
                      <p className="sentra-body-md">{chapter.copy}</p>
                    </div>
                  ))}
                </div>
                <div className="sentra-stage-steps" role="tablist" aria-label="Platform chapters">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.step}
                      type="button"
                      role="tab"
                      aria-selected={activeChapter === index}
                      aria-label={`${chapter.step}: ${chapter.kicker}`}
                      className={activeChapter === index ? 'is-active' : ''}
                      onClick={() => selectChapter(index)}
                    >
                      {chapter.step}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sentra-visual sentra-platform-visual">
              <div className="sentra-stage-frame">
                <div className="sentra-stage-frame__glow" aria-hidden />
                <div className="sentra-stage-canvas">
                  <ThreeErrorBoundary fallback={<StaticStageModel />}>
                    <CinematicStage progress={progress} pointer={pointer} />
                  </ThreeErrorBoundary>
                </div>
                <div className="sentra-stage-chip sentra-stage-chip--tl">
                  <small>Active elements</small>
                  <strong key={activeChapter}>{chapters[activeChapter].elements}</strong>
                </div>
                <div className="sentra-stage-chip sentra-stage-chip--br">
                  <small>Model confidence</small>
                  <strong key={`c-${activeChapter}`}>{chapters[activeChapter].confidence}</strong>
                </div>
                <div className="sentra-stage-meter" role="tablist" aria-label="Chapter progress">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.step}
                      type="button"
                      role="tab"
                      aria-selected={activeChapter === index}
                      aria-label={chapter.kicker}
                      className={activeChapter === index ? 'is-active' : ''}
                      title={chapter.kicker}
                      onClick={() => selectChapter(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="sentra-section">
        <div className="sentra-container">
          <div className="sentra-section-head sentra-section-head--row">
            <div className="sentra-stack">
              <span className="sentra-pill">Intelligence</span>
              <h2 className="sentra-heading-xl">
                Quietly powerful.
                <span className="sentra-hero__accent">Precisely connected.</span>
              </h2>
              <p className="sentra-body-lg">
                Monitor, verify, and orchestrate quantity workflows with the same calm precision as a command OS.
              </p>
            </div>
            <Link className="sentra-btn sentra-btn--ghost sentra-section-head__cta" to="/dashboard">
              Open workspace <Arrow />
            </Link>
          </div>
          <div className="sentra-card-grid sentra-feature-grid">
            {features.map((feature, index) => (
              <motion.article
                key={feature.tag}
                className="sentra-cap-card sentra-feature-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className={`sentra-feature-glow sentra-feature-glow--${index + 1}`} aria-hidden />
                <span className="sentra-cap-card__icon" aria-hidden>{['◈', '◎', '⬡'][index]}</span>
                <p className="sentra-cap-card__tag">{feature.tag}</p>
                <h3>{feature.title}</h3>
                <small>{feature.copy}</small>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="sentra-section">
        <div className="sentra-container">
          <div className="sentra-finale-panel">
            <div className="sentra-finale-glow" aria-hidden />
            <div className="sentra-split sentra-finale-grid">
              <div className="sentra-stack sentra-finale-copy">
                <span className="sentra-pill">Workflow</span>
                <h2 className="sentra-heading-xl">
                  Build with
                  <span className="sentra-hero__accent">complete clarity.</span>
                </h2>
                <p className="sentra-body-lg">
                  Bring every decision into focus with a workspace designed for the pace of modern construction — upload, extract, estimate, and deliver.
                </p>
                <div className="sentra-actions">
                  <Link className="sentra-btn sentra-btn--primary sentra-btn--lg" to="/dashboard">
                    Enter the workspace <Arrow />
                  </Link>
                  <Link className="sentra-btn sentra-btn--ghost" to="/upload">
                    Upload a drawing
                  </Link>
                </div>
              </div>
              <div className="sentra-visual sentra-finale-visual">
                <ThreeErrorBoundary fallback={<WorkflowFinaleFallback />}>
                  <div className="sentra-finale-canvas">
                    <WorkflowFinaleScene />
                  </div>
                </ThreeErrorBoundary>
                <ul className="sentra-finale-legend" aria-hidden>
                  {['Upload', 'Extract', 'Estimate', 'Deliver'].map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="sentra-footer">
        <div className="sentra-container sentra-footer__inner">
          <div className="sentra-footer__brand">
            <Link className="sentra-brand" to="/">
              <img className="custom-logo-filter" src="/logo.png" alt="Dee Bug" />
            </Link>
            <p>Spatial intelligence for the built world.</p>
          </div>
          <div className="sentra-footer__links">
            <a href="#platform">Platform</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#intelligence">Intelligence</a>
            <Link to="/dashboard">Workspace</Link>
          </div>
          <span className="sentra-footer__copy">© {new Date().getFullYear()} DaiBoq</span>
        </div>
      </footer>
    </main>
  );
}
