import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  IconDashboard,
  IconUpload,
  IconBoq,
  Icon3D,
  IconCost,
  IconRevision,
  IconQuote,
  IconLeaf,
  IconSite,
} from '../icons/Icons';

const logoFallback = (event) => {
  event.currentTarget.src = '/daiboq-logo.svg';
};

const navItems = [
  { section: 'Overview', links: [
    { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  ]},
  { section: 'QS Workflow', links: [
    { to: '/upload', label: 'Drawing Upload', icon: IconUpload },
    { to: '/boq', label: 'BOQ Generator', icon: IconBoq },
    { to: '/visualization', label: '3D Visualization', icon: Icon3D },
    { to: '/cost', label: 'Cost Estimation', icon: IconCost },
  ]},
  { section: 'Intelligence', links: [
    { to: '/revision', label: 'Revision Compare', icon: IconRevision },
    { to: '/quotation', label: 'Quotation Analyzer', icon: IconQuote },
    { to: '/sustainability', label: 'Sustainability', icon: IconLeaf },
    { to: '/site-progress', label: 'Site Progress', icon: IconSite },
  ]},
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link className="sidebar-brand" to="/" onClick={() => setOpen(false)} aria-label="Dee Bug home">
          <img
            className="sidebar-logo-img"
            src="/logo.png"
            alt="Dee Bug"
            onError={logoFallback}
          />
        </Link>
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <link.icon className="nav-icon" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <strong>AI Engine Ready</strong>
            OpenAI API integration slot configured on backend
          </div>
        </div>
      </aside>
      <button type="button" className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
        Menu
      </button>
    </>
  );
}
