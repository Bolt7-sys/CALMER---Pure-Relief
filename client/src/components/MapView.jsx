import { useRef } from 'react'

// Stylized dark SVG "map" with an animated glowing gold route line
// from the CALMER hub (rider) to the client's pinned destination.
// progress: 0..1 how far along the route the rider is.
export default function MapView({ progress = 0.35, height = 380 }) {
  const riderRef = useRef(null)

  // Route waypoints (SVG viewBox 0..400 x 0..380)
  const path = 'M 40 60 C 120 100, 90 180, 190 200 S 280 300, 350 320'

  // Approximate rider position by interpolating a few control points
  const pts = [
    { x: 40, y: 60 }, { x: 130, y: 140 }, { x: 190, y: 200 }, { x: 270, y: 270 }, { x: 350, y: 320 }
  ]
  const seg = Math.min(pts.length - 2, Math.floor(progress * (pts.length - 1)))
  const localT = (progress * (pts.length - 1)) - seg
  const rx = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * localT
  const ry = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * localT

  return (
    <div className="relative rounded-3xl overflow-hidden card" style={{ height }}>
      {/* Map base */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 30% 20%, #1a1710 0%, #0c0b09 60%, #060504 100%)'
      }} />
      {/* grid streets */}
      <svg viewBox="0 0 400 380" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE27A" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <pattern id="streets" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,215,0,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="380" fill="url(#streets)" />
        {/* a couple of "blocks" */}
        {[[60,90],[160,60],[250,150],[300,240],[120,260]].map(([x,y],i)=>(
          <rect key={i} x={x} y={y} width="46" height="46" rx="6" fill="rgba(255,215,0,0.035)" stroke="rgba(255,215,0,0.05)" />
        ))}
        {/* the animated route line (gold glowing) */}
        <path d={path} className="route-line" />
        <path d={path} fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="8" />

        {/* Hub origin */}
        <circle cx="40" cy="60" r="8" fill="url(#goldGrad)" />
        <circle cx="40" cy="60" r="14" fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="2" />

        {/* Destination pin */}
        <g transform="translate(350,320)">
          <circle r="20" fill="rgba(255,215,0,0.12)">
            <animate attributeName="r" values="16;26;16" dur="2s" repeatCount="indefinite" />
          </circle>
          <path d="M 0 -20 C 12 -20 18 -10 18 -2 C 18 8 0 20 0 20 C 0 20 -18 8 -18 -2 C -18 -10 -12 -20 0 -20 Z" fill="url(#goldGrad)" />
          <circle cx="0" cy="-2" r="6" fill="#0A0A0A" />
        </g>
      </svg>

      {/* Rider marker */}
      <div ref={riderRef} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
        style={{ left: `${(rx / 400) * 100}%`, top: `${(ry / 380) * 100}%` }}>
        <div className="w-11 h-11 rounded-full bg-gold-gradient grid place-items-center shadow-gold-lg animate-float">
          <i className="fa-solid fa-motorcycle text-black"></i>
        </div>
      </div>

      {/* labels */}
      <div className="absolute top-3 left-3 glass-strong rounded-full px-3 py-1.5 text-[11px] text-rich-gold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Tracking
      </div>
    </div>
  )
}
