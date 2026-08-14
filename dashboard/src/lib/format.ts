const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatMonthLabel(mes: string): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  const data = new Date(ano, mesNum - 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(data);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(mes: string, delta: number): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  const data = new Date(ano, mesNum - 1 + delta, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonth(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  const [, mes, dia] = dateStr.split("-");
  return `${dia}/${mes}`;
}
