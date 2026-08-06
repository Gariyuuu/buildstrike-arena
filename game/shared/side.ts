/** Who an entity (player, bot, build) belongs to. Kept dependency-free so both
 * browser code and the party server (Cloudflare Worker) can import it. */
export type EntitySide = "local" | "opponent" | "bot" | "neutral";
