import React from 'react';

/**
 * Recrea fielmente la estela de luz radiante curvada que atraviesa el centro
 * del diseño en la imagen de referencia.
 */
export const AmbientGlowCurve = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <svg
        className="w-full h-full min-h-[640px]"
        viewBox="0 0 1440 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="30" result="blur3" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="curveStreak" x1="0%" y1="70%" x2="100%" y2="20%">
            <stop offset="0%" stopColor="rgba(255, 248, 238, 0.2)" />
            <stop offset="25%" stopColor="rgba(255, 252, 245, 0.75)" />
            <stop offset="55%" stopColor="rgba(255, 255, 255, 0.98)" />
            <stop offset="85%" stopColor="rgba(255, 248, 238, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 245, 235, 0.35)" />
          </linearGradient>

          <radialGradient id="centerWarmBloom" cx="45%" cy="60%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 246, 235, 0.28)" />
            <stop offset="50%" stopColor="rgba(255, 240, 225, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 240, 225, 0)" />
          </radialGradient>
        </defs>

        {/* Resplandor cálido ambiental */}
        <ellipse cx="640" cy="460" rx="650" ry="260" fill="url(#centerWarmBloom)" />

        {/* Arco luminoso desenfocado (halo) */}
        <path
          d="M -60 480 C 320 620, 680 520, 1500 170"
          stroke="url(#curveStreak)"
          strokeWidth="6"
          filter="url(#softGlow)"
          opacity="0.85"
        />

        {/* Núcleo fino y nítido de luz blanca */}
        <path
          d="M -60 480 C 320 620, 680 520, 1500 170"
          stroke="#ffffff"
          strokeWidth="2.2"
          opacity="0.95"
        />
      </svg>
    </div>
  );
};
