import { STANDARDS } from "@/lib/site";

/** Infinite CSS marquee of ISO standard codes. Duplicated track for seamless loop. */
export function StandardsMarquee({ className = "" }: { className?: string }) {
  const items = STANDARDS.map((s) => s.code);
  const track = [...items, ...items];
  return (
    <div className={`mask-fade-x overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee gap-3">
        {track.map((code, i) => (
          <span
            key={`${code}-${i}`}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-navy-800 shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            {code}
          </span>
        ))}
      </div>
    </div>
  );
}
