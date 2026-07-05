import { IMG } from '../lib/images'

export default function Logo({ size = 44, showText = true, subtitle = 'CANNABIS DELIVERY', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={IMG.logo}
        alt="CALMER logo"
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-1 ring-rich-gold/40 shadow-gold"
      />
      {showText && (
        <div className="leading-none">
          <div className="font-brand text-2xl gold-text">CALMER</div>
          {subtitle && <div className="text-[9px] tracking-[0.35em] text-soft-gold/70 mt-1">{subtitle}</div>}
        </div>
      )}
    </div>
  )
}
