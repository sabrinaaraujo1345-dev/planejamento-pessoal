import { Check } from "lucide-react";

type Props = {
  summary: string;
  accent?: "indigo" | "emerald" | "amber";
  phase: string;
  items: string[];
};

const DOT: Record<string, string> = {
  indigo: "text-indigo-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
};

export function ModulePlaceholder({ summary, accent = "indigo", phase, items }: Props) {
  return (
    <section className="card rounded-2xl p-6 max-w-3xl">
      <p className="text-sm text-zinc-300">{summary}</p>
      <p className="mt-1 text-xs text-zinc-500">Entra na {phase}.</p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${DOT[accent]}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
