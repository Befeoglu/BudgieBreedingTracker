/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e3',
          200: '#bbe5cc',
          300: '#8ad1a8',
          400: '#52b37d',
          500: '#2d9959',
          600: '#1f7a44',
          700: '#1a6237',
          800: '#164f2e',
          900: '#134127',
          950: '#0a2415',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'bird-float': 'birdFloat 3s ease-in-out infinite',
        'bird-body': 'birdBody 2s ease-in-out infinite',
        'bird-head': 'birdHead 1.5s ease-in-out infinite',
        'bird-wing': 'birdWing 0.8s ease-in-out infinite',
        'bird-tail': 'birdTail 1.2s ease-in-out infinite',
        'bird-beak': 'birdBeak 2.5s ease-in-out infinite',
        'bird-eye': 'birdEye 3s ease-in-out infinite',
        'particle-1': 'particle1 4s ease-in-out infinite',
        'particle-2': 'particle2 3s ease-in-out infinite',
        'particle-3': 'particle3 5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-delayed': 'floatDelayed 8s ease-in-out infinite 2s',
        'float-fast': 'floatFast 4s ease-in-out infinite 1s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
        birdFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' },
        },
        birdBody: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        birdHead: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        birdWing: {
          '0%, 100%': { transform: 'rotate(15deg) scaleY(1)' },
          '50%': { transform: 'rotate(25deg) scaleY(0.8)' },
        },
        birdTail: {
          '0%, 100%': { transform: 'rotate(25deg)' },
          '50%': { transform: 'rotate(35deg)' },
        },
        birdBeak: {
          '0%, 90%, 100%': { transform: 'scale(1)' },
          '95%': { transform: 'scale(1.1)' },
        },
        birdEye: {
          '0%, 90%, 100%': { transform: 'scale(1)' },
          '95%': { transform: 'scale(0.8)' },
        },
        particle1: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.4' },
          '50%': { transform: 'translateY(-20px) translateX(10px)', opacity: '0.8' },
        },
        particle2: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.3' },
          '50%': { transform: 'translateY(-15px) translateX(-8px)', opacity: '0.7' },
        },
        particle3: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.5' },
          '50%': { transform: 'translateY(-25px) translateX(5px)', opacity: '0.9' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        floatDelayed: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-15px) translateX(-10px)' },
        },
        floatFast: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-10px) translateX(8px)' },
        },
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};