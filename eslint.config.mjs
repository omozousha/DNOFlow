import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Local-only / backups
    ".trash/**",
    "db-query.*",
  ]),

  // Project overrides: keep lint actionable (warnings), while fixing incrementally.
  {
    rules: {
      // Too many legacy `any` usages to treat as errors right now.
      "@typescript-eslint/no-explicit-any": "warn",

      // Common in content-heavy pages; treat as warning.
      "react/no-unescaped-entities": "warn",

      // Prefer fixing gradually; keep as warning for now.
      "react-hooks/set-state-in-effect": "warn",

      // Mostly stylistic; warning is enough.
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
