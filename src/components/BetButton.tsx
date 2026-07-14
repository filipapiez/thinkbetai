// =============================================================
// BetButton.tsx — one-tap path from any price to the book
// Drop into src/components/. Used on EdgeFeed cards, arb/middle
// legs, and OddsScreen cells.
// =============================================================

import { resolveBetLink, isDeepLink, bookLabel } from "@/lib/bookLinks";

const AMBER = "#F5B942";
const MUTED = "#8B98AC";

export default function BetButton({
  book,
  apiLink,
  compact = false,
}: {
  book: string;
  apiLink?: string | null;
  /** compact: icon-sized for odds-grid cells */
  compact?: boolean;
}) {
  const href = resolveBetLink(book, apiLink);
  const deep = isDeepLink(apiLink);
  if (href === "#") return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={deep ? `Open betslip at ${bookLabel(book)}` : `Open ${bookLabel(book)}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 600,
        fontSize: compact ? 8 : 10,
        color: deep ? "#131313" : AMBER,
        background: deep ? AMBER : "transparent",
        border: `1px solid ${deep ? AMBER : MUTED}`,
        borderRadius: 3,
        padding: compact ? "2px 6px" : "6px 12px",
        textDecoration: "none",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {compact ? "BET" : deep ? "BET SLIP ↗" : "OPEN BOOK ↗"}
    </a>
  );
}
