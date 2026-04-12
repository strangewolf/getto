"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { NavGlyph } from "@/components/NavGlyphs";
import { ProductLogo } from "@/components/ProductLogo";
import BorderGlow from "@/components/react-bits/BorderGlow/BorderGlow";

const MotionLink = motion.create(Link);

const SIDEBAR_KEY = "slp-sidebar-collapsed";

const nav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    glyph: "dashboard",
    roles: ["admin", "warehouse_manager", "dispatcher", "driver", "retailer"],
  },
  {
    href: "/locations",
    label: "Locations",
    glyph: "locations",
    roles: ["admin", "warehouse_manager", "dispatcher"],
  },
  {
    href: "/skus",
    label: "SKUs",
    glyph: "skus",
    roles: ["admin", "warehouse_manager", "dispatcher", "retailer"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    glyph: "inventory",
    roles: ["admin", "warehouse_manager"],
  },
  {
    href: "/transfers",
    label: "Transfers",
    glyph: "transfers",
    roles: ["admin", "warehouse_manager"],
  },
  {
    href: "/orders",
    label: "Orders",
    glyph: "orders",
    roles: ["admin", "warehouse_manager", "dispatcher", "retailer"],
  },
  { href: "/planning", label: "Planning", glyph: "planning", roles: ["admin", "dispatcher"] },
  { href: "/trips", label: "Trips", glyph: "trips", roles: ["admin", "dispatcher", "driver"] },
  {
    href: "/reports",
    label: "Reports",
    glyph: "reports",
    roles: ["admin", "dispatcher", "warehouse_manager"],
  },
] as const;

function canSee(roles: readonly string[], userRoles: string[]) {
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

function ProfileGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function NavLinks({
  me,
  pathname,
  collapsed,
  onNavigate,
}: {
  me: { roles: string[] };
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [tip, setTip] = useState<{ label: string; style: CSSProperties } | null>(null);
  const linkRefs = useRef<Record<string, HTMLElement | null>>({});

  const showTip = (href: string, label: string) => {
    if (!collapsed) return;
    const el = linkRefs.current[href];
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip({
      label,
      style: {
        position: "fixed",
        top: r.top + r.height / 2,
        left: r.right + 10,
        transform: "translateY(-50%)",
        zIndex: 10_000,
      },
    });
  };

  const hideTip = () => setTip(null);

  const tooltip =
    tip && typeof document !== "undefined"
      ? createPortal(
          <span
            role="tooltip"
            className="pointer-events-none z-[10000] rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 shadow-xl shadow-black/40"
            style={tip.style}
          >
            {tip.label}
          </span>,
          document.body,
        )
      : null;

  return (
    <nav className="space-y-1 p-2" onMouseLeave={hideTip}>
      {tooltip}
      {nav
        .filter((n) => canSee(n.roles, me.roles))
        .map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <div
              key={n.href}
              ref={(el) => {
                linkRefs.current[n.href] = el;
              }}
              className="rounded-lg"
            >
              <MotionLink
                href={n.href}
                onClick={onNavigate}
                onMouseEnter={() => showTip(n.href, n.label)}
                onFocus={() => showTip(n.href, n.label)}
                onBlur={hideTip}
                className={`flex items-center gap-3 rounded-lg py-2.5 pl-2 pr-3 text-sm font-medium transition-colors md:py-2 ${
                  collapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-primary-950/45 text-primary-200 ring-1 ring-primary-500/30"
                    : "text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 active:bg-zinc-800"
                }`}
                whileHover={{ scale: collapsed ? 1.05 : 1.02, x: collapsed ? 0 : 2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <NavGlyph id={n.glyph} />
                <span className={collapsed ? "sr-only" : ""}>{n.label}</span>
              </MotionLink>
            </div>
          );
        })}
    </nav>
  );
}

const collapseBtnClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-600/90 bg-zinc-900 text-zinc-200 shadow-sm transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

function SidebarFooter({
  collapsed,
  me,
  pathname,
  onToggleCollapse,
  onLogout,
  onNavigate,
  showSidebarCollapse,
}: {
  collapsed: boolean;
  me: { email: string; roles: string[] };
  pathname: string;
  onToggleCollapse: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
  showSidebarCollapse: boolean;
}) {
  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");
  const [tip, setTip] = useState<{ label: string; style: CSSProperties } | null>(null);
  const tipTargetRefs = useRef<Record<string, HTMLElement | null>>({});

  const showFooterTip = (key: string, label: string) => {
    if (!collapsed) return;
    const el = tipTargetRefs.current[key];
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip({
      label,
      style: {
        position: "fixed",
        top: r.top + r.height / 2,
        left: r.right + 10,
        transform: "translateY(-50%)",
        zIndex: 10_000,
      },
    });
  };

  const hideFooterTip = () => setTip(null);

  useEffect(() => {
    if (!collapsed) setTip(null);
  }, [collapsed]);

  const footerTooltip =
    collapsed && tip && typeof document !== "undefined"
      ? createPortal(
          <span
            role="tooltip"
            className="pointer-events-none z-[10000] rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 shadow-xl shadow-black/40"
            style={tip.style}
          >
            {tip.label}
          </span>,
          document.body,
        )
      : null;

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-[#0a0514]/95 p-2" onMouseLeave={hideFooterTip}>
      {footerTooltip}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 py-1">
          <div
            ref={(el) => {
              tipTargetRefs.current.profile = el;
            }}
            className="rounded-lg"
          >
            <MotionLink
              href="/profile"
              onClick={onNavigate}
              onMouseEnter={() => showFooterTip("profile", "Profile & account")}
              onFocus={() => showFooterTip("profile", "Profile & account")}
              onBlur={hideFooterTip}
              aria-label="Profile & account"
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                profileActive
                  ? "border-primary-500/50 bg-primary-950/40 text-primary-200"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <ProfileGlyph />
            </MotionLink>
          </div>
          {showSidebarCollapse ? (
            <div
              ref={(el) => {
                tipTargetRefs.current.expand = el;
              }}
              className="rounded-lg"
            >
              <motion.button
                type="button"
                onClick={onToggleCollapse}
                onMouseEnter={() => showFooterTip("expand", "Expand sidebar")}
                onFocus={() => showFooterTip("expand", "Expand sidebar")}
                onBlur={hideFooterTip}
                className={collapseBtnClass}
                aria-label="Expand sidebar"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          ) : null}
          <div
            ref={(el) => {
              tipTargetRefs.current.logout = el;
            }}
            className="rounded-lg"
          >
            <BorderGlow borderRadius={10} glowRadius={14} backgroundColor="#12081f" colors={["#8400ff", "#c084fc", "#22d3ee"]} className="p-0">
              <motion.button
                type="button"
                onClick={onLogout}
                onMouseEnter={() => showFooterTip("logout", "Log out")}
                onFocus={() => showFooterTip("logout", "Log out")}
                onBlur={hideFooterTip}
                aria-label="Log out"
                className="bits-type-body flex h-9 w-9 items-center justify-center text-zinc-100"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </motion.button>
            </BorderGlow>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <MotionLink
            href="/profile"
            onClick={onNavigate}
            className={`block rounded-lg px-2 py-2 transition-colors ${
              profileActive ? "bg-primary-950/35 ring-1 ring-primary-500/25" : "hover:bg-zinc-800/80"
            }`}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300">
                <ProfileGlyph />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-zinc-500">Profile & account</div>
                <div className="truncate text-sm text-zinc-200">{me.email}</div>
                <div className="truncate text-[10px] text-zinc-500" title={me.roles.join(", ")}>
                  {me.roles.length <= 1 ? me.roles[0] : `${me.roles[0]} +${me.roles.length - 1}`}
                </div>
              </div>
            </div>
          </MotionLink>
          {showSidebarCollapse ? (
            <motion.button
              type="button"
              onClick={onToggleCollapse}
              className="chamfer-control flex w-full min-h-9 items-center justify-center gap-2 border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              aria-label="Collapse sidebar"
              whileTap={{ scale: 0.98 }}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Collapse sidebar
            </motion.button>
          ) : null}
          <BorderGlow borderRadius={10} glowRadius={14} backgroundColor="#12081f" colors={["#8400ff", "#c084fc", "#22d3ee"]} className="p-0">
            <motion.button
              type="button"
              onClick={onLogout}
              className="bits-type-body w-full px-3 py-2.5 text-xs font-semibold text-zinc-100"
              whileTap={{ scale: 0.98 }}
            >
              Log out
            </motion.button>
          </BorderGlow>
        </div>
      )}
    </div>
  );
}

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`shrink-0 border-b border-zinc-800 ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
      <div className={`flex ${collapsed ? "flex-col items-center justify-center gap-0" : "items-center gap-2"}`}>
        <ProductLogo size={collapsed ? 34 : 36} className="shrink-0" />
        {!collapsed ? (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold tracking-tight text-primary-400">Smart Login Portal</div>
            <div className="truncate text-[10px] text-zinc-500">Operations</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      const n = !c;
      try {
        localStorage.setItem(SIDEBAR_KEY, n ? "1" : "0");
      } catch {
        /* ignore */
      }
      return n;
    });
  };

  if (!me) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#060010] text-zinc-100">
      <aside
        className={`hidden max-h-[100dvh] min-h-0 flex-shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-[#0a0514] transition-[width] duration-300 ease-out md:flex md:sticky md:top-0 md:self-start md:h-[100dvh] ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-56"
        }`}
      >
        <SidebarHeader collapsed={sidebarCollapsed} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <NavLinks me={me} pathname={pathname} collapsed={sidebarCollapsed} />
        </div>
        <SidebarFooter
          collapsed={sidebarCollapsed}
          me={me}
          pathname={pathname}
          onToggleCollapse={toggleSidebar}
          onLogout={() => logout()}
          showSidebarCollapse
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] max-w-sm flex-col border-r border-zinc-800 bg-[#0a0514] shadow-xl"
            style={{
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <ProductLogo size={32} />
                <span className="text-sm font-semibold text-primary-800 dark:text-primary-300">Menu</span>
              </div>
              <motion.button
                type="button"
                className="chamfer-control p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                whileTap={{ scale: 0.92 }}
              >
                <MenuIcon open />
              </motion.button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <NavLinks me={me} pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter
              collapsed={false}
              me={me}
              pathname={pathname}
              onToggleCollapse={toggleSidebar}
              onLogout={() => {
                setMobileOpen(false);
                logout();
              }}
              onNavigate={() => setMobileOpen(false)}
              showSidebarCollapse={false}
            />
          </motion.aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {!mobileOpen ? (
          <motion.button
            type="button"
            className="chamfer-control fixed z-40 flex h-11 w-11 items-center justify-center border border-zinc-700 bg-[#0a0514]/95 text-zinc-200 shadow-lg backdrop-blur-sm md:hidden"
            style={{
              top: "max(0.625rem, env(safe-area-inset-top))",
              left: "max(0.75rem, env(safe-area-inset-left))",
            }}
            aria-label="Open menu"
            aria-expanded={false}
            onClick={() => setMobileOpen(true)}
            whileTap={{ scale: 0.94 }}
          >
            <MenuIcon />
          </motion.button>
        ) : null}

        <main
          className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden p-3 pt-[3.25rem] sm:p-4 md:p-6 md:pt-6"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
