import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "archive/**",
      ".open-next/**",
      ".wrangler/**",
      "storybook-static/**",
      "next-env.d.ts",
      "scripts/**/*.js"
    ]
  },
  ...compat.config({
    root: true,
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {}
  })
];

export default config;
