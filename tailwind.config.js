/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#007bff",
        "primary-hover": "#0056b3",
        surface: "#f4f4f9",
        card: "#ffffff",
        border: "#e5e7eb",
        "text-main": "#333333",
        "text-heading": "#111827",
        "text-muted": "#6b7280",
        "text-light": "#9ca3af",
      },
    },
  },
  plugins: [],
};
