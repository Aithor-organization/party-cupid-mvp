import type { Config } from "tailwindcss";

// Party Cupid v13 디자인 시스템 토큰 (기획서 + design/v13)
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF4D6D",
        "primary-soft": "#FFE3E8",
        accent: "#7C3AED",
        "accent-soft": "#EDE4FF",
        success: "#10B981",
        "success-soft": "#D4F7E8",
        warning: "#F59E0B",
        "warning-surface": "#FEF3C7",
        danger: "#EF4444",
        bg: "#FFF7F8",
        surface: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
