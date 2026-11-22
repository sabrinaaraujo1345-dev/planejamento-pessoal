import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/apartamento/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <ToastProvider>
      <AppShell dateLabel={dateLabel}>{children}</AppShell>
    </ToastProvider>
  );
}
