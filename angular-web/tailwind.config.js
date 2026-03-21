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
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        headline: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        label: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
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
        /* Material3 surface tokens — Stitch "Neon Conservatory" palette */
        "surface-container-lowest": "rgb(4 14 31 / <alpha-value>)",
        "surface-container-low": "rgb(17 28 45 / <alpha-value>)",
        "surface-container": "rgb(21 32 49 / <alpha-value>)",
        "surface-container-high": "rgb(31 42 60 / <alpha-value>)",
        "surface-container-highest": "rgb(42 53 72 / <alpha-value>)",
        "surface-bright": "rgb(47 58 76 / <alpha-value>)",
        "surface-variant": "rgb(42 53 72 / <alpha-value>)",
        "on-surface": "rgb(216 227 251 / <alpha-value>)",
        "on-surface-variant": "rgb(189 200 210 / <alpha-value>)",
        "on-background": "rgb(216 227 251 / <alpha-value>)",
        "primary-container": "rgb(20 184 255 / <alpha-value>)",
        "on-primary-container": "rgb(0 69 100 / <alpha-value>)",
        "secondary-container": "rgb(0 185 84 / <alpha-value>)",
        "on-secondary-container": "rgb(0 65 25 / <alpha-value>)",
        "tertiary-container": "rgb(208 169 0 / <alpha-value>)",
        "on-tertiary-container": "rgb(80 63 0 / <alpha-value>)",
        "error-container": "rgb(147 0 10 / <alpha-value>)",
        "on-error-container": "rgb(255 218 214 / <alpha-value>)",
        outline: "rgb(135 146 155 / <alpha-value>)",
        "outline-variant": "rgb(62 72 80 / <alpha-value>)",
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
