import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#ec4899", soft: "#fbcfe8", deep: "#be185d" }
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Pretendard", "Apple SD Gothic Neo", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
