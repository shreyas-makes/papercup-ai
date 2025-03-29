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
        success: '#4CAF50',
        error: '#FF4444',
        background: '#F5F5F5',
        'text-secondary': '#333333'
      },
      keyframes: {
        flashfade: { "0%, 100%": { opacity: "0" }, "5%, 80%": { opacity: "1" } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ]
}
