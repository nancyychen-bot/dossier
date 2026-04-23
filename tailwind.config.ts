import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF7",
        ink: "#111111",
        muted: "#6B6B66",
        rule: "#D4D4CE",
        accent: "#C8533C",
        paper: "#F2F1EA",
      },
      fontFamily: {
        sans: ['"Inter Tight"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        serif: ['"EB Garamond"', "Georgia", "serif"],
        instrument: ['"Instrument Serif"', "Georgia", "serif"],
        fraunces: ["Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "1px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        "2xl": "2px",
        full: "2px",
      },
      boxShadow: {
        none: "none",
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
      },
    },
  },
  plugins: [],
};
export default config;
