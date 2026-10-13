/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  trailingComma: "all",
  // Sorts Tailwind classes in the official order, so class lists diff and review cleanly.
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./apps/web/src/styles/globals.css",
  tailwindFunctions: ["cn", "cva"],
};

export default config;
