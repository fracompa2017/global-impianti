import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary:     { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card:        { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        cream: {
          50:  "#FDFCFA",
          100: "#FAF8F5",
          200: "#F4F1EB",
          300: "#EDE9E2",
          400: "#E2DDD5",
          500: "#D1CBC0",
        },
        navy: {
          600: "#243C78",
          700: "#1C3060",
          800: "#142448",
          900: "#0C1A3A",
        },
        brand: {
          blue:   "#2B5CE6",
          light:  "#4A78F5",
          orange: "#F97316",
        },
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md:  "14px",
        lg:  "18px",
        xl:  "22px",
        "2xl": "28px",
        "3xl": "36px",
        "4xl": "44px",
      },
      boxShadow: {
        xs:     "0 1px 3px rgba(12,26,58,0.06)",
        sm:     "0 2px 8px rgba(12,26,58,0.07), 0 1px 2px rgba(12,26,58,0.04)",
        md:     "0 4px 16px rgba(12,26,58,0.09), 0 2px 6px rgba(12,26,58,0.05)",
        lg:     "0 8px 32px rgba(12,26,58,0.11), 0 3px 10px rgba(12,26,58,0.06)",
        xl:     "0 16px 48px rgba(12,26,58,0.13), 0 6px 16px rgba(12,26,58,0.07)",
        float:  "0 20px 60px rgba(12,26,58,0.15), 0 8px 24px rgba(12,26,58,0.08)",
        btn:    "0 4px 16px rgba(43,92,230,0.38), 0 1px 4px rgba(43,92,230,0.22)",
        "btn-orange": "0 4px 16px rgba(249,115,22,0.38), 0 1px 4px rgba(249,115,22,0.22)",
        nav:    "0 -4px 24px rgba(12,26,58,0.08), 0 -1px 0 rgba(195,189,180,0.4)",
        card:   "0 2px 8px rgba(12,26,58,0.07), 0 1px 2px rgba(12,26,58,0.04)",
        "card-lg": "0 8px 32px rgba(12,26,58,0.11), 0 3px 10px rgba(12,26,58,0.06)",
      },
      backgroundImage: {
        "grad-brand":  "linear-gradient(135deg, #2B5CE6 0%, #4A78F5 100%)",
        "grad-navy":   "linear-gradient(160deg, #0C1A3A 0%, #142448 55%, #1C3060 100%)",
        "grad-orange": "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
        "grad-card":   "linear-gradient(145deg, #FFFFFF 0%, #F9F7F4 100%)",
        "grad-mesh":   "radial-gradient(ellipse at 15% 45%, rgba(43,92,230,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(74,120,245,0.05) 0%, transparent 50%), radial-gradient(ellipse at 55% 85%, rgba(249,115,22,0.04) 0%, transparent 50%)",
        "grad-hero-blue": "linear-gradient(160deg, #0C1A3A 0%, #142448 55%, #1C3060 100%)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "float": "float 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
