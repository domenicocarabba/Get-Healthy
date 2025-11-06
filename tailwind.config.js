/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: { green: "#10B981", dark: "#065F46" }
      },
      fontFamily: {
        display: ["ui-sans-serif","system-ui","Inter","Segoe UI","Roboto","Helvetica","Arial","sans-serif"]
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(1200px 600px at 50% -20%, #D1FAE5 0%, transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)"
      }
    },
  },
  plugins: [],
};
