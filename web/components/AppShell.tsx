"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

function MenuIcon({ open }: { open?: boolean }) {
  if (open) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SidebarBrand() {
  return (
    <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <div className="text-lg font-bold leading-tight text-emerald-700 dark:text-emerald-400">
        Smart Login Portal
      </div>
      <div className="text-xs text-zinc-500">Operations</div>
    </div>
  );
}

function NavLinkList({
  me,
  pathname,
  onNavigate,
}: {
  me: { roles: string[] };
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 p-2">
      {nav
        .filter((n) => canSee(n.roles, me.roles))
        .map((n) => {
          const active =
            pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onNavigate}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium md:py-2 ${
                active
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const el = document.documentElement;
    if (mobileOpen) {
      el.style.overflow = "hidden";
    } else {
      el.style.overflow = "";
    }
    return () => {
      el.style.overflow = "";
    };
  }, [mobileOpen]);

  if (!me) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[100dvh] bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <SidebarBrand />
        <NavLinkList me={me} pathname={pathname} />
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] max-w-sm flex-col border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            style={{
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            }}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <MenuIcon open />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <NavLinkList
                me={me}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex flex-shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950 sm:gap-3 sm:px-4 sm:py-3"
          style={{
            paddingTop: "max(0.625rem, env(safe-area-inset-top))",
            paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
          }}
        >
          <button
            type="button"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-zinc-500 sm:text-sm">
              <span className="hidden sm:inline">Org · </span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{me.email}</span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
            <span
              className="hidden max-w-[9rem] truncate rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 sm:inline-block sm:max-w-[12rem] dark:bg-zinc-900 dark:text-zinc-400"
              title={me.roles.join(", ")}
            >
              {me.roles.length <= 1
                ? me.roles[0]
                : `${me.roles[0]} +${me.roles.length - 1}`}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900 sm:min-h-0 sm:py-1.5"
            >
              Log out
            </button>
          </div>
        </header>
        <main
          className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
