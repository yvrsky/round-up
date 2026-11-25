/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Must be "class": with SDK 58's async web routes the stylesheet loads after NativeWind's web
  // runtime, which then calls colorScheme.set("system") — that throws when darkMode is "media".
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#E11D48",
          dark: "#9F1239",
        },
        ink: "#0F172A",
      },
    },
  },
  plugins: [],
};
