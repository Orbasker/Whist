/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Noto Serif", "Georgia", "serif"],
        headline: ["Noto Serif", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary) / <alpha-value>)",
          foreground: "hsl(var(--tertiary-foreground) / <alpha-value>)",
        },
        /* Material3 surface tokens — Stitch "Whist" palette */
        "surface-container-lowest": "rgb(6 14 32 / <alpha-value>)",
        "surface-container-low": "rgb(19 27 46 / <alpha-value>)",
        "surface-container": "rgb(23 31 51 / <alpha-value>)",
        "surface-container-high": "rgb(34 42 61 / <alpha-value>)",
        "surface-container-highest": "rgb(45 52 73 / <alpha-value>)",
        "surface-bright": "rgb(49 57 77 / <alpha-value>)",
        "surface-variant": "rgb(45 52 73 / <alpha-value>)",
        "on-surface": "rgb(218 226 253 / <alpha-value>)",
        "on-surface-variant": "rgb(191 201 195 / <alpha-value>)",
        "on-background": "rgb(218 226 253 / <alpha-value>)",
        "primary-container": "rgb(6 78 59 / <alpha-value>)",
        "on-primary-container": "rgb(128 190 166 / <alpha-value>)",
        "secondary-container": "rgb(238 152 0 / <alpha-value>)",
        "on-secondary-container": "rgb(91 56 0 / <alpha-value>)",
        "tertiary-container": "rgb(59 69 79 / <alpha-value>)",
        "on-tertiary-container": "rgb(168 178 190 / <alpha-value>)",
        "error-container": "rgb(147 0 10 / <alpha-value>)",
        "on-error-container": "rgb(255 218 214 / <alpha-value>)",
        outline: "rgb(137 147 141 / <alpha-value>)",
        "outline-variant": "rgb(64 73 68 / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
