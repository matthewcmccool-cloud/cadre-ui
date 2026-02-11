/**
 * Live data ticker — horizontal scrolling bar below nav.
 * Server component. Data passed in as props (computed by page).
 * CSS animation for continuous scroll (~40px/second).
 */

interface TickerEntry {
  text: string;
}

interface LiveTickerProps {
  entries: TickerEntry[];
}

export default function LiveTicker({ entries }: LiveTickerProps) {
  if (entries.length === 0) return null;

  // Duplicate entries to create seamless loop
  const allEntries = [...entries, ...entries];

  return (
    <div className="h-8 bg-zinc-900 overflow-hidden relative">
      <div className="animate-ticker flex items-center h-full whitespace-nowrap">
        {allEntries.map((entry, i) => (
          <span key={i} className="text-xs text-zinc-400 mx-4 shrink-0">
            {entry.text}
          </span>
        ))}
      </div>
    </div>
  );
}
