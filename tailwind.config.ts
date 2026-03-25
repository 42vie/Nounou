import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        violet: {
          light: "#CC99FF",
          DEFAULT: "#E9ABEB",
          fonce: "#CFC6F2",
        },
        lavande: "#E7E2F8",
        rose: {
          saisie: "#FFE4E1",
        },
      },
    },
  },
  plugins: [],
};
export default config;
