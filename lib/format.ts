const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(n);
export const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
