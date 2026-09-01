"use client";

/**
 * Signature visual for the auth panel: a stack of "document" cards that
 * rotate gently on their own. Base offset (--doc-x/y/z) is applied as a
 * static inline `transform` fallback, so the stack still looks correct
 * even if the "docFloat" keyframes in globals.css haven't loaded yet.
 * The animation keyframes live in globals.css to avoid SSR/client
 * hydration mismatches (no inline <style> tag).
 */
export default function DocumentStackVisual() {
  const cards = [
    {
      color: "var(--primary-soft)",
      offset: 2,
      delay: "0s",
      label: "3 people editing",
      lines: ["Q3 Product Roadmap", "Overview & goals for the quarter"],
    },
    {
      color: "var(--accent-soft)",
      offset: 1,
      delay: "-2.3s",
      label: "@ali mentioned you",
      lines: ["Meeting Notes", "Action items from today's sync"],
    },
    {
      color: "var(--surface)",
      offset: 0,
      delay: "-4.6s",
      label: "Saved just now",
      lines: ["Untitled document", "Start writing..."],
    },
  ];

  return (
    <div
      className="relative flex h-72 w-72 items-center justify-center"
      style={{ perspective: "1200px" }}
    >
      {cards
        .slice()
        .reverse()
        .map((card) => {
          const baseTransform = `translate(${card.offset * 14}px, ${
            -card.offset * 18
          }px) translateZ(${card.offset * 20}px)`;

          return (
            <div
              key={card.offset}
              className="doc-float absolute h-56 w-44 rounded-[var(--radius-lg)] border border-[var(--border-light)]"
              style={
                {
                  background: card.color,
                  boxShadow: "var(--shadow-lg)",
                  transform: baseTransform,
                  "--doc-x": `${card.offset * 14}px`,
                  "--doc-y": `${-card.offset * 18}px`,
                  "--doc-z": `${card.offset * 20}px`,
                  animationDelay: card.delay,
                  transformStyle: "preserve-3d",
                } as React.CSSProperties
              }
            >
              <div className="flex h-full flex-col gap-2 p-4">
                <div className="h-2 w-3/5 rounded-full bg-[var(--foreground)] opacity-15" />
                <p className="mt-1 text-[11px] font-semibold leading-tight text-[var(--foreground)] opacity-80">
                  {card.lines[0]}
                </p>
                <p className="text-[9px] leading-snug text-[var(--foreground)] opacity-50">
                  {card.lines[1]}
                </p>
                <div className="mt-1 h-1.5 w-4/5 rounded-full bg-[var(--foreground)] opacity-10" />
                <div className="h-1.5 w-2/5 rounded-full bg-[var(--foreground)] opacity-10" />

                <span className="mt-auto inline-block w-fit rounded-full bg-white/70 px-2 py-1 text-[10px] font-medium text-[var(--foreground-secondary)]">
                  {card.label}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
}
