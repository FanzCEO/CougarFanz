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
        // CougarFanz brand colors - Luxury Gold & Wine palette
        cfz: {
          gold: "hsl(43, 74%, 51%)",           // #D4AF37 - Primary gold
          "gold-light": "hsl(43, 74%, 65%)",   // Lighter gold for hover
          "gold-dark": "hsl(43, 74%, 40%)",    // Darker gold for depth
          wine: "hsl(355, 45%, 33%)",          // #722F37 - Wine ruby
          "wine-light": "hsl(355, 45%, 45%)", // Lighter wine
          cardinal: "hsl(350, 74%, 40%)",      // #C41E3A - Cardinal red
          "cardinal-light": "hsl(350, 74%, 55%)",
          "satin-black": "hsl(0, 0%, 10%)",    // #1A1A1A - Primary background
          espresso: "hsl(0, 0%, 18%)",         // #2D2D2D - Card/surface
          "espresso-light": "hsl(0, 0%, 22%)", // #383838 - Elevated surface
          charcoal: "hsl(0, 0%, 14%)",         // #242424 - Mid background
          champagne: "hsl(39, 77%, 83%)",      // #F7E7CE - Light accents
          "champagne-dark": "hsl(39, 60%, 70%)",
          bronze: "hsl(30, 67%, 40%)",         // #A97142 - Metallic bronze
          "rose-gold": "hsl(10, 50%, 75%)",    // #E8B4B8 - Rose gold
          platinum: "hsl(0, 0%, 85%)",         // #D9D9D9 - Platinum
          border: "hsl(0, 0%, 24%)",           // #3D3D3D - Borders
          muted: "hsl(0, 0%, 60%)",            // #999999 - Muted text
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
        // CougarFanz gold glows
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.15)',
        'gold-medium': '0 0 30px rgba(212, 175, 55, 0.25)',
        'gold-strong': '0 0 40px rgba(212, 175, 55, 0.35)',
        'gold-intense': '0 0 60px rgba(212, 175, 55, 0.5)',
        'wine-glow': '0 0 20px rgba(114, 47, 55, 0.3)',
        'wine-strong': '0 0 40px rgba(114, 47, 55, 0.5)',
      },
      backgroundImage: {
        'pack-howl': 'linear-gradient(135deg, #A3FF12 0%, #2563EB 60%, #00E5FF 100%)',
        'trail-mix': 'linear-gradient(90deg, #A3FF12, #FF7A00)',
        'moonyard': 'radial-gradient(1100px 520px at 70% -8%, rgba(37,99,235,0.25) 0%, #0A0A0B 60%)',
        // CougarFanz gradients
        'luxe': 'linear-gradient(135deg, #D4AF37 0%, #A97142 100%)',
        'luxe-reverse': 'linear-gradient(135deg, #A97142 0%, #D4AF37 100%)',
        'velvet': 'linear-gradient(180deg, #2D2D2D 0%, #1A1A1A 100%)',
        'wine-gradient': 'linear-gradient(135deg, #722F37 0%, #C41E3A 100%)',
        'champagne': 'linear-gradient(135deg, #F7E7CE 0%, #D4AF37 100%)',
        'cougar-hero': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
        'cougar-spotlight': 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.2) 0%, transparent 50%)',
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
