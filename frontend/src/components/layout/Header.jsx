import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLatestDrawing } from '../../utils/drawingSession';

function projectLabelFromDrawing(drawing) {
  if (!drawing?.fileName) return null;
  return drawing.fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

export default function Header() {
  const [query, setQuery] = useState('');
  const [drawing, setDrawing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getLatestDrawing().then((stored) => {
      if (!cancelled) setDrawing(stored);
    });
    return () => { cancelled = true; };
  }, []);

  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/boq?q=${encodeURIComponent(q)}`);
  };

  const projectName = projectLabelFromDrawing(drawing);

  return (
    <header className="app-header">
      <div className="header-search">
        <span aria-hidden>⌕</span>
        <input
          type="search"
          placeholder="Search BOQ items, materials…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
              e.preventDefault();
              e.currentTarget.focus();
            }
          }}
        />
        <kbd>Ctrl K</kbd>
      </div>
      <div className="header-actions">
        <div className="header-project">
          <div className="header-project-label">Active drawing</div>
          {projectName ? (
            <Link to="/visualization" className="header-project-name" title={drawing.fileName}>
              {projectName}
            </Link>
          ) : (
            <Link to="/upload" className="header-project-name header-project-name--empty">
              Upload a DWG to begin
            </Link>
          )}
        </div>
        <Link className="header-avatar" to="/dashboard" title="Deebug workspace" aria-label="Open dashboard">
          <img className="header-avatar-logo" src="/logo.png" alt="" />
        </Link>
      </div>
    </header>
  );
}
