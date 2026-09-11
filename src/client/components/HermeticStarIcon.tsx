import React from 'react';

interface HermeticStarIconProps {
  className?: string;
}

export const HermeticStarIcon: React.FC<HermeticStarIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
  >
    <defs>
      {/* Background Radial Glow */}
      <radialGradient id="dv-oracle-bg-glow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="#1e1405" stopOpacity="0.9" />
        <stop offset="65%" stopColor="#0a0907" stopOpacity="0.98" />
        <stop offset="100%" stopColor="#040404" stopOpacity="1" />
      </radialGradient>

      {/* Central Aura */}
      <radialGradient id="dv-oracle-aura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
        <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>

      {/* Gold Gradients for Facets */}
      <linearGradient id="dv-oracle-gold-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#fffbeb" />
        <stop offset="70%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>

      <linearGradient id="dv-oracle-gold-mid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>

      <linearGradient id="dv-oracle-gold-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="60%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>

      <linearGradient id="dv-oracle-gold-border" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#b45309" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#fef08a" stopOpacity="0.7" />
      </linearGradient>
    </defs>

    {/* Base container: Squircle with gold rim */}
    <rect
      x="2"
      y="2"
      width="60"
      height="60"
      rx="14"
      fill="url(#dv-oracle-bg-glow)"
      stroke="url(#dv-oracle-gold-border)"
      strokeWidth="1.2"
    />

    {/* Subtle sacred geometry outer orbit */}
    <circle
      cx="32"
      cy="32"
      r="23"
      fill="none"
      stroke="#d97706"
      strokeOpacity="0.3"
      strokeDasharray="2 3"
      strokeWidth="0.8"
    />
    <circle
      cx="32"
      cy="32"
      r="26.5"
      fill="none"
      stroke="#f59e0b"
      strokeOpacity="0.15"
      strokeWidth="0.5"
    />

    {/* Ambient Glow */}
    <circle cx="32" cy="32" r="16" fill="url(#dv-oracle-aura)" />

    {/* Secondary Diagonal Rays (8-point Hermetic Star) */}
    <g>
      <polygon points="32,32 45,19 32,26" fill="url(#dv-oracle-gold-mid)" />
      <polygon points="32,32 45,19 38,32" fill="url(#dv-oracle-gold-dark)" />
      <polygon points="32,32 45,45 38,32" fill="url(#dv-oracle-gold-mid)" />
      <polygon points="32,32 45,45 32,38" fill="url(#dv-oracle-gold-dark)" />
      <polygon points="32,32 19,45 32,38" fill="url(#dv-oracle-gold-mid)" />
      <polygon points="32,32 19,45 26,32" fill="url(#dv-oracle-gold-dark)" />
      <polygon points="32,32 19,19 26,32" fill="url(#dv-oracle-gold-mid)" />
      <polygon points="32,32 19,19 32,26" fill="url(#dv-oracle-gold-dark)" />
    </g>

    {/* Cardinal Primary Rays (Facet 3D Shading) */}
    <g>
      <polygon points="32,32 27,27 32,7" fill="url(#dv-oracle-gold-light)" />
      <polygon points="32,32 37,27 32,7" fill="url(#dv-oracle-gold-dark)" />
      <polygon points="32,32 37,27 57,32" fill="url(#dv-oracle-gold-light)" />
      <polygon points="32,32 37,37 57,32" fill="url(#dv-oracle-gold-dark)" />
      <polygon points="32,32 37,37 32,57" fill="url(#dv-oracle-gold-mid)" />
      <polygon points="32,32 27,37 32,57" fill="url(#dv-oracle-gold-light)" />
      <polygon points="32,32 27,37 7,32" fill="url(#dv-oracle-gold-dark)" />
      <polygon points="32,32 27,27 7,32" fill="url(#dv-oracle-gold-light)" />
    </g>

    {/* Central Core Diamond & Spark */}
    <polygon points="32,26 38,32 32,38 26,32" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.6" />
    <circle cx="32" cy="32" r="2" fill="#ffffff" />

    {/* Four Cardinal Celestial Dots */}
    <circle cx="32" cy="4" r="1" fill="#fef08a" opacity="0.9" />
    <circle cx="60" cy="32" r="1" fill="#fef08a" opacity="0.9" />
    <circle cx="32" cy="60" r="1" fill="#fef08a" opacity="0.9" />
    <circle cx="4" cy="32" r="1" fill="#fef08a" opacity="0.9" />
  </svg>
);
