const svgProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, viewBox: '0 0 24 24' };

export function IconDashboard({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function IconUpload({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M12 16V4M12 4l4 4M12 4L8 8" strokeLinecap="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

export function IconBoq({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

export function Icon3D({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M12 3l9 5v8l-9 5-9-5V8l9-5z" />
      <path d="M12 12l9-5M12 12v10M12 12L3 7" />
    </svg>
  );
}

export function IconCost({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h4.5a1.5 1.5 0 010 3H9" />
    </svg>
  );
}

export function IconRevision({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M4 6h16M4 12h10M4 18h14" />
      <path d="M18 10l3 2-3 2v-4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconQuote({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M8 8h8v12H8z" />
      <path d="M10 6V4h4v2M6 12h4M6 16h6" />
    </svg>
  );
}

export function IconLeaf({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M12 22c-4-4-8-8-8-14a8 8 0 0116 0c0 6-4 10-8 14z" />
      <path d="M12 12v10" />
    </svg>
  );
}

export function IconSite({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="2" />
      <path d="M21 17l-5-5-4 4-3-3-6 6" />
    </svg>
  );
}
