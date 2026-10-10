import Link from "next/link";

const items = [
  { href: "/", label: "Home" },
  { href: "/team", label: "My team" },
  { href: "/catalogue", label: "Products" },
  { href: "/calendar", label: "Calendar" },
  { href: "/culture", label: "Culture" },
];

export function MemberNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Member workspace"
      className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 text-sm"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current === item.href ? "page" : undefined}
          className={`rounded-lg px-3 py-2 ${current === item.href ? "bg-yellow-100 font-semibold text-zinc-900" : "text-zinc-600 hover:bg-zinc-100"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
