export interface ThemeDefinition {
  id: string;
  name: string;
  cyan: string;
  cyanDim: string;
  orange: string;
}

// Overrides the two CSS custom properties (--bs-cyan, --bs-orange, see
// app/globals.css) the whole UI's accent colors derive from — a Tailwind v4
// @theme token can't be swapped at runtime, but the raw --bs-* variable it
// references can be, so this is applied via document.documentElement.style
// rather than a class/data-attribute + CSS override.
export const THEMES: ThemeDefinition[] = [
  { id: "cyan-orange", name: "Cyan & Orange", cyan: "#33e6ff", cyanDim: "#1c8fa3", orange: "#ff8a33" },
  { id: "purple-pink", name: "Purple & Pink", cyan: "#b56bff", cyanDim: "#6b3a99", orange: "#ff5fa8" },
  { id: "green-gold", name: "Green & Gold", cyan: "#33ff8a", cyanDim: "#1a8a4d", orange: "#ffd23f" },
  { id: "red-blue", name: "Crimson & Blue", cyan: "#ff4d6a", cyanDim: "#99263a", orange: "#3a8fff" },
  { id: "mono-ice", name: "Mono Ice", cyan: "#9fd8ff", cyanDim: "#3f6b80", orange: "#c9d6e0" },
];

export const DEFAULT_THEME_ID = "cyan-orange";
