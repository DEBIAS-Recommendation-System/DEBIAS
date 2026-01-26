import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
const MyClass = plugin(function ({ addUtilities }: any) {
  addUtilities({
    ".my-rotate-y-180": {
      transform: "rotateY(180deg)",
    },
    ".preserve-3d": {
      transformStyle: "preserve-3d",
    },
    ".perspective": {
      perspective: "1000px",
    },
    ".backface-hidden": {
      backfaceVisibility: "hidden",
    },
    ".scroll-snap-none": {
      scrollSnapType: "none",
    },
    ".scroll-snap-x": {
      scrollSnapType: "x",
    },
    ".scroll-snap-y": {
      scrollSnapType: "y",
    },
    ".text-shadow": {
      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
    },
  });
});
const config: Config = {
  darkMode: ["class"],
  mode: "jit",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        show: {
          "0%": { bottom: "0" },
          "100%": { transform: "5rem" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      height: {
        screen: "100dvh",
      },
      width: {
        screen: "100dvw",
      },
      minHeight: {
        screen: "100dvh",
      },
      minWidth: {
        screen: "100dvw",
      },
      maxHeight: {
        screen: "100dvh",
      },
      maxWidth: {
        screen: "100dvw",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        color1: "#e15250",
        color2: "#3394aa",
        color3: "#8ec3d6",
        color4: "#f2a0b8",
        color5: "#dea40e",
        color6: "#2095f2",
        color7: "#8977d2",
        color8: "#ff6900 ",
      },
      boxShadow: {
        text: "2px 2px 4px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [MyClass, require("tailwindcss-animate"), require("daisyui")],
  daisyui: {
    themes: ["light"],
  },
};

export default config;
