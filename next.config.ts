import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode intentionally double-invokes render/useMemo in
  // development to surface impure code. That's incompatible with the Rapier
  // physics world (character controllers, colliders) and other imperative
  // WebGL/WASM state this game creates — double-creating them corrupts
  // internal handles. Strict Mode has no effect on production builds either
  // way, so disabling it only changes dev-time behavior.
  reactStrictMode: false,
};

export default nextConfig;
