"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const nav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["admin", "warehouse_manager", "dispatcher", "driver", "retailer"],
  },
  {
    href: "/locations",
    label: "Locations",
    roles: ["admin", "warehouse_manager", "dispatcher"],
  },
  {
    href: "/skus",
    label: "SKUs",
    roles: ["admin", "warehouse_manager", "dispatcher", "retailer"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    roles: ["admin", "warehouse_manager"],
  },
  {
    href: "/transfers",
    label: "Transfers",
    roles: ["admin", "warehouse_manager"],
  },
  {
    href: "/orders",
    label: "Orders",
    roles: ["admin", "warehouse_manager", "dispatcher", "retailer"],
  },
  { href: "/planning", label: "Planning", roles: ["admin", "dispatcher"] },
  { href: "/trips", label: "Trips", roles: ["admin", "dispatcher", "driver"] },
  {
    href: "/reports",
    label: "Reports",
    roles: ["admin", "dispatcher", "warehouse_manager"],
  },
];

function canSee(roles: string[], userRoles: string[]) {
  return userRoles.some((r) => roles.includes(r));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="hidden w-56 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <div className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            Getto
          </div>
          <div className="text-xs text-zinc-500">Supply chain ops</div>
        </div>
        <nav className="space-y-1 p-2">
          {nav
            .filter((n) => me && canSee(n.roles, me.roles))
            .map((n) => {
              const active =
                pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm text-zinc-500">
            Org ·{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {me?.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {me?.roles.join(", ")}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
