"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  ShieldCheck,
  Globe2,
  Wallet,
  X,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import { DataMenu } from "@/components/data-menu";

const NAV = [
  {
    href: "/dashboard",
    label: "Visão Geral",
    icon: LayoutDashboard,
    title: "Visão Geral",
    accent: "indigo",
  },
  {
    href: "/planejamento",
    label: "Planejamento & Metas",
    icon: CalendarCheck2,
    title: "Planejamento & Metas",
    accent: "indigo",
  },
  {
    href: "/estudos",
    label: "Estudos",
    icon: GraduationCap,
    title: "Estudos",
    accent: "indigo",
  },
  {
    href: "/financas",
    label: "Finanças",
    icon: Wallet,
    title: "Finanças Pessoais",
    accent: "emerald",
  },
  {
    href: "/apartamento",
    label: "Meu Apartamento",
    icon: Home,
    title: "Meu Apartamento",
    accent: "amber",
  },
  {
    href: "/rotina",
    label: "Rotina & Hábitos",
    icon: Repeat,
    title: "Rotina, Hábitos & Desenvolvimento",
    accent: "indigo",
  },
] as const;

const ACTIVE: Record<string, string> = {
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/35",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/35",
};

export function AppShell({
  children,
  dateLabel,
}: {
  children: React.ReactNode;
  dateLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV.find((n) => pathname.startsWith(n.href)) ?? NAV[0];

  return (
    <div className="flex h-screen overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface-900 border-r border-surface-700 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                Meu <span className="text-brand">Planejamento</span>
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Privado • só você
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white p-1"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Módulos"
        >
          {NAV.map(({ href, label, icon: Icon, accent }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  active
                    ? ACTIVE[accent]
                    : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <DataMenu />

        <form action={signOut} className="p-3 border-t border-surface-700">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </form>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 px-4 sm:px-6 flex items-center justify-between border-b border-surface-700 bg-surface-900/60 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden text-zinc-300 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/60"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">
              {current.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="hidden sm:block capitalize">{dateLabel}</span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Modo privado
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
