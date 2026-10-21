import Link from "next/link";
import {
  CalendarDays,
  MessageCircle,
  NotebookPen,
  UsersRound,
  Library,
} from "lucide-react";
const items = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/assistant", label: "Chat", icon: MessageCircle },
  { href: "/leads", label: "Leads", icon: UsersRound },
  { href: "/briefings", label: "HQH / HHH", icon: NotebookPen },
  { href: "/resources", label: "Resources", icon: Library },
];
export function MemberNav({ current }: { current: string }) {
  const selected = ["/team", "/catalogue", "/calendar", "/culture"].includes(
    current,
  )
    ? "/resources"
    : current;
  return (
    <nav
      aria-label="fcOS workspace"
      className="mb-2 border-b border-zinc-200 pb-4"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          fc<span className="text-yellow-500">OS</span>
        </Link>
        <span className="text-xs text-zinc-500">Prepare · connect · grow</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={selected === item.href ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] sm:flex-row sm:gap-2 sm:text-sm ${selected === item.href ? "bg-yellow-100 font-semibold text-zinc-900" : "text-zinc-600 hover:bg-zinc-100"}`}
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
