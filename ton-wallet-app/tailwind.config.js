/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surface hierarchy
        "background":                "#111317",
        "surface":                   "#111317",
        "surface-dim":               "#111317",
        "surface-bright":            "#37393d",
        "surface-container-lowest":  "#0c0e11",
        "surface-container-low":     "#1a1c1f",
        "surface-container":         "#1e2023",
        "surface-container-high":    "#282a2d",
        "surface-container-highest": "#333538",
        "surface-variant":           "#333538",
        "surface-tint":              "#a0caff",

        // On-surface
        "on-surface":         "#e2e2e6",
        "on-surface-variant": "#c1c7d2",
        "inverse-surface":    "#e2e2e6",
        "inverse-on-surface": "#2f3034",

        // Primary
        "primary":                "#a0caff",
        "on-primary":             "#003259",
        "primary-container":      "#4f94dd",
        "on-primary-container":   "#002b4e",
        "primary-fixed":          "#d2e4ff",
        "primary-fixed-dim":      "#a0caff",
        "on-primary-fixed":       "#001c37",
        "on-primary-fixed-variant":"#00497e",
        "inverse-primary":        "#0061a5",

        // Secondary
        "secondary":                  "#bfc6db",
        "on-secondary":               "#283140",
        "secondary-container":        "#41495a",
        "on-secondary-container":     "#b0b8cc",
        "secondary-fixed":            "#dbe2f7",
        "secondary-fixed-dim":        "#bfc6db",
        "on-secondary-fixed":         "#141c2a",
        "on-secondary-fixed-variant": "#3f4757",

        // Tertiary (warning-like)
        "tertiary":                  "#ffb955",
        "on-tertiary":               "#452b00",
        "tertiary-container":        "#c68200",
        "on-tertiary-container":     "#3c2500",
        "tertiary-fixed":            "#ffddb4",
        "tertiary-fixed-dim":        "#ffb955",
        "on-tertiary-fixed":         "#291800",
        "on-tertiary-fixed-variant": "#633f00",

        // Error
        "error":              "#ffb4ab",
        "on-error":           "#690005",
        "error-container":    "#93000a",
        "on-error-container": "#ffdad6",

        // Outline
        "outline":         "#8b919c",
        "outline-variant": "#414751",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        mono:     ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        sm:      "0.125rem",
        md:      "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
      },
    },
  },
  plugins: [],
}
