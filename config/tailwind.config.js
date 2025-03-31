const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Work Sans', ...defaultTheme.fontFamily.sans]
      },
      // color palette as defined in specifications
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FFD700',
        'accent-light': '#FFF8E0',
        success: '#4CAF50',
        error: '#FF4444',
        background: '#F5F5F5',
        'text-secondary': '#333333',
        'warning-bg': '#FFF3DC'
      },
      keyframes: {
        flashfade: { "0%, 100%": { opacity: "0" }, "5%, 80%": { opacity: "1" } },
        'fade-in': { 
          "0%": { opacity: "0", transform: "translateY(10px)" }, 
          "100%": { opacity: "1", transform: "translateY(0)" } 
        },
        'fade-out': { 
          "0%": { opacity: "1", transform: "translateY(0)" }, 
          "100%": { opacity: "0", transform: "translateY(10px)" } 
        },
        'slide-down': { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(0)" } },
        'slide-up': { "0%": { transform: "translateY(0)" }, "100%": { transform: "translateY(-100%)" } },
        'pulse': { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        'progress-bar': { "0%": { width: "0%" }, "100%": { width: "100%" } }
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out forwards',
        'fade-out': 'fade-out 300ms ease-out forwards',
        'slide-down': 'slide-down 200ms ease-out forwards',
        'slide-up': 'slide-up 200ms ease-out forwards',
        'pulse': 'pulse 1.5s ease-in-out infinite',
        'progress-bar': 'progress-bar 5s linear forwards'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ]
}
