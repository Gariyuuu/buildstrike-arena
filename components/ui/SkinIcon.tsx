"use client";

import type { CharacterSkin } from "@/components/game/CharacterModel";

const DEFAULT_SKIN_TONE = "#d3a077";
const DEFAULT_HAIR = "#2a2118";

/** Small flat front-facing character glyph built from the same color fields
 * CharacterModel uses, so Shop/Locker cards show roughly what a skin looks
 * like before spending coins on it — without paying for a real 3D preview
 * render per card. */
export function SkinIcon({ skin, size = 56 }: { skin: CharacterSkin; size?: number }) {
  const jacket = skin.jacketColor ?? "#3aa0c9";
  const pants = skin.pantsColor ?? "#2a2f3a";
  const shoe = skin.shoeColor ?? "#15181f";
  const skinTone = skin.skinTone ?? DEFAULT_SKIN_TONE;
  const hair = skin.hairColor ?? DEFAULT_HAIR;
  const accent = skin.accentColor ?? "#33e6ff";
  const hasHair = skin.hasHair ?? true;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="block">
      <rect x="24" y="46" width="7" height="14" rx="1.5" fill={pants} />
      <rect x="33" y="46" width="7" height="14" rx="1.5" fill={pants} />
      <rect x="23" y="58" width="9" height="4" rx="1" fill={shoe} />
      <rect x="32" y="58" width="9" height="4" rx="1" fill={shoe} />
      <rect x="13" y="27" width="7" height="17" rx="3" fill={jacket} />
      <rect x="44" y="27" width="7" height="17" rx="3" fill={jacket} />
      <rect x="19" y="26" width="26" height="22" rx="4" fill={jacket} />
      <rect x="19" y="34" width="26" height="3" fill={accent} />
      <circle cx="32" cy="16" r="11" fill={skinTone} />
      <rect x="23" y="14" width="18" height="5" rx="1" fill="#0a0c11" />
      <rect x="25" y="15" width="5" height="3" rx="0.5" fill={accent} />
      <rect x="34" y="15" width="5" height="3" rx="0.5" fill={accent} />
      {hasHair && <rect x="21" y="6" width="22" height="11" rx="6" fill={hair} />}
    </svg>
  );
}
