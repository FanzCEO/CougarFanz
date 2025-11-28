import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // PupFanz brand colors
        pf: {
          volt: "hsl(78, 100%, 54%)", // #A3FF12
          cobalt: "hsl(217, 91%, 60%)", // #2563EB
          tangerine: "hsl(24, 100%, 50%)", // #FF7A00
          ink: "hsl(240, 10%, 3.9%)", // #0A0A0B
          graphite: "hsl(240, 8%, 7%)", // #121214
          snow: "hsl(210, 25%, 95%)", // #F5F7FA
          mist: "hsl(220, 14%, 82%)", // #C9D0D6
        },
        // Base theme colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Semantic colors
        success: "hsl(142, 76%, 36%)", // #22C55E
        warning: "hsl(38, 92%, 50%)", // #F59E0B
        error: "hsl(0, 84%, 60%)", // #EF4444
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        'volt-glow': '0 0 24px rgba(163, 255, 18, 0.25)',
        'volt-strong': '0 0 40px rgba(163, 255, 18, 0.4)',
      },
      backgroundImage: {
        'pack-howl': 'linear-gradient(135deg, #A3FF12 0%, #2563EB 60%, #00E5FF 100%)',
        'trail-mix': 'linear-gradient(90deg, #A3FF12, #FF7A00)',
        'moonyard': 'radial-gradient(1100px 520px at 70% -8%, rgba(37,99,235,0.25) 0%, #0A0A0B 60%)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" }
        },
        "glow-pulse": {
          "0%": { boxShadow: "0 0 20px rgba(163,255,18,0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(163,255,18,0.6)" }
        },
        "pack-howl": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-subtle": "bounce-subtle 2s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
        "pack-howl": "pack-howl 3s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
