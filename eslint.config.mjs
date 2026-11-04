import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
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
  {
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  }
];

export default config;
