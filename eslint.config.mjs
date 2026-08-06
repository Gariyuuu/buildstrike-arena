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
    // Cloudflare Worker source has its own tsconfig/lint story.
    "party/**",
    // wrangler dev's generated build cache/bundle output (gitignored) — not
    // source, found by running `npm run party:dev` locally.
    ".wrangler/**",
  ]),
  {
    // The React Compiler hook rules (purity/immutability/refs/set-state-in-effect)
    // assume typical component render bodies. react-three-fiber's `useFrame`
    // callback intentionally runs outside React's render phase every animation
    // frame and mutates Object3D/camera properties directly — that's the
    // correct, idiomatic r3f pattern, not a purity violation, so these rules
    // are disabled for the game engine code that lives inside the Canvas tree.
    files: ["components/game/**/*.{ts,tsx}", "game/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
