/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'deep-black': '#0A0A0A',
        'rich-black': '#111111',
        'panel': '#161310',
        'rich-gold': '#FFD700',
        'warm-amber': '#FFC107',
        'soft-gold': '#D4AF37',
        'muted-gold': '#B8860B'
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'gold': '0 8px 30px rgba(255, 215, 0, 0.15)',
        'gold-lg': '0 12px 48px rgba(255, 215, 0, 0.25)'
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)',
        'dark-radial': 'radial-gradient(circle at 50% 0%, #1a1710 0%, #0A0A0A 70%)'
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } }
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 4s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
