import type { Config } from "tailwindcss";

/** Chamfer only top-left and bottom-right (45° cuts). Keeps TR and BL square for a subtle industrial look. */
function chamferPolygonTLBR(px: number): string {
  return `polygon(${px}px 0,100% 0,100% calc(100% - ${px}px),calc(100% - ${px}px) 100%,0 100%,0 ${px}px)`;
}

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /** Magic Bento / React Bits purple (#8400ff) — app-wide accent */
        primary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#8400ff",
          600: "#7500e6",
          700: "#6300c4",
          800: "#5200a3",
          900: "#3d0077",
          950: "#1f003d",
        },
      },
      fontFamily: {
        sans: ["var(--font-bits-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-bits-display)", "var(--font-bits-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [
    function chamferPlugin({ addComponents }: { addComponents: (c: Record<string, Record<string, string>>) => void }) {
      addComponents({
        ".chamfer-clip-sm": { clipPath: chamferPolygonTLBR(3) },
        ".chamfer-clip": { clipPath: chamferPolygonTLBR(5) },
        ".chamfer-clip-lg": { clipPath: chamferPolygonTLBR(7) },
        ".chamfer-card": {
          clipPath: chamferPolygonTLBR(8),
        },
        ".chamfer-control": {
          clipPath: chamferPolygonTLBR(4),
        },
        ".chamfer-input": {
          clipPath: chamferPolygonTLBR(3),
        },
      });
    },
  ],
} satisfies Config;
