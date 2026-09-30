import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f8f9fa",
        surface: "#ffffff",
        subtle: "#f1f5f9",
        border: "#e2e8f0",
        "border-strong": "#cbd5e1"
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
