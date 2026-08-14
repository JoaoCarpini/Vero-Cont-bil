import { categorical, MUTED } from "./palette";

export interface DistItem {
  label: string;
  value: number;
  color: string;
}

const FORMA_PAGAMENTO_INFO: Record<string, { label: string; color: string }> = {
  pix: { label: "Pix", color: categorical[0] },
  debito: { label: "Débito", color: categorical[1] },
  credito: { label: "Crédito", color: categorical[2] },
  dinheiro: { label: "Dinheiro", color: categorical[3] },
  vr: { label: "VR", color: categorical[4] },
  va: { label: "VA", color: categorical[5] },
};

export function formaPagamentoLabel(forma: string): string {
  return FORMA_PAGAMENTO_INFO[forma.toLowerCase()]?.label ?? forma;
}

function formaPagamentoColor(forma: string): string {
  return FORMA_PAGAMENTO_INFO[forma.toLowerCase()]?.color ?? MUTED;
}

// Mantém as 7 maiores fatias com cor dedicada e dobra o restante em "Outros",
// evitando gerar matizes além da paleta validada.
export function buildCategoriaSeries(raw: { categoria: string; total: number }[]): DistItem[] {
  const ordenado = [...raw].sort((a, b) => b.total - a.total);
  const max = 7;

  if (ordenado.length <= max) {
    return ordenado.map((item, i) => ({
      label: item.categoria,
      value: item.total,
      color: categorical[i],
    }));
  }

  const cabeca = ordenado.slice(0, max);
  const cauda = ordenado.slice(max);
  const outros = cauda.reduce((soma, item) => soma + item.total, 0);

  return [
    ...cabeca.map((item, i) => ({ label: item.categoria, value: item.total, color: categorical[i] })),
    { label: "Outros", value: outros, color: MUTED },
  ];
}

export function buildFormaPagamentoSeries(
  raw: { forma_pagamento: string; total: number }[],
): DistItem[] {
  return [...raw]
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      label: formaPagamentoLabel(item.forma_pagamento),
      value: item.total,
      color: formaPagamentoColor(item.forma_pagamento),
    }));
}
