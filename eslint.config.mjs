import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Folder boundaries: src/frontend (browser), src/backend (server), src/shared (both).
// Only src/pages and src/proxy.ts may wire frontend and backend together.
const restrict = (...groups) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: groups.map(([group, message]) => ({
        group: [`@/${group}/*`, `**/${group}/*`],
        message,
      })),
    },
  ],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["src/frontend/**"],
    rules: restrict(["backend", "Frontend code must not import backend code; call an API route."]),
  },
  {
    files: ["src/backend/**"],
    rules: restrict(["frontend", "Backend code must not import frontend code."]),
  },
  {
    files: ["src/shared/**"],
    rules: restrict(
      ["frontend", "Shared code must not depend on the frontend."],
      ["backend", "Shared code must not depend on the backend."],
    ),
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/shared/types/database.ts",
  ]),
]);

export default eslintConfig;
