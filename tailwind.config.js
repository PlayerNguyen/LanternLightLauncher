/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,css,ts,jsx,tsx}",
    "./dist/src/**/*.{html,css,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        light: {
          100: "#fff",
        },
      },
    },
  },
  plugins: [],
};
