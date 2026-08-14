import { ArrowDownRight, ArrowUpRight, Landmark, Repeat } from "lucide-react";
import type { Saldo, SaldoAtual as SaldoAtualType } from "../types";
import { formatCurrency } from "../lib/format";
import { SaldoAtualRow } from "./SaldoAtualRow";

interface Props {
  saldo: Saldo;
  saldoAtual: SaldoAtualType | null;
  onSaveSaldoAtual: (valor: number) => Promise<void>;
  mesLabel: string;
}

export function SaldoHero({ saldo, saldoAtual, onSaveSaldoAtual, mesLabel }: Props) {
  const positivo = saldo.saldo_projetado >= 0;
  const diferenca = saldoAtual ? saldoAtual.valor - saldo.saldo_projetado : null;

  return (
    <section className="saldo-hero">
      <SaldoAtualRow saldoAtual={saldoAtual} onSave={onSaveSaldoAtual} />

      <div className="saldo-hero-main">
        <span className="saldo-hero-label">Saldo projetado · {mesLabel}</span>
        <span className={`saldo-hero-value ${positivo ? "is-positive" : "is-negative"}`}>
          {formatCurrency(saldo.saldo_projetado)}
        </span>
        {diferenca !== null && Math.abs(diferenca) >= 0.01 && (
          <span className="saldo-hero-diff">
            {diferenca > 0 ? "▲" : "▼"} {formatCurrency(Math.abs(diferenca))}{" "}
            {diferenca > 0 ? "acima" : "abaixo"} do saldo atual
          </span>
        )}
      </div>

      <div className="saldo-hero-breakdown">
        <div className="breakdown-item">
          <Landmark size={16} strokeWidth={1.75} />
          <div>
            <span className="breakdown-label">Salário base</span>
            <span className="breakdown-value">{formatCurrency(saldo.salario_base)}</span>
          </div>
        </div>
        <div className="breakdown-item">
          <ArrowUpRight size={16} strokeWidth={1.75} className="icon-good" />
          <div>
            <span className="breakdown-label">Entradas lançadas</span>
            <span className="breakdown-value">{formatCurrency(saldo.entradas_lancadas)}</span>
          </div>
        </div>
        <div className="breakdown-item">
          <ArrowDownRight size={16} strokeWidth={1.75} className="icon-critical" />
          <div>
            <span className="breakdown-label">Saídas lançadas</span>
            <span className="breakdown-value">{formatCurrency(saldo.saidas_lancadas)}</span>
          </div>
        </div>
        <div className="breakdown-item">
          <Repeat size={16} strokeWidth={1.75} />
          <div>
            <span className="breakdown-label">Gastos recorrentes</span>
            <span className="breakdown-value">{formatCurrency(saldo.gastos_recorrentes)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
