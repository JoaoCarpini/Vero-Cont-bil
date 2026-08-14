import { AlertTriangle, ChevronLeft, ChevronRight, LogOut, RefreshCw, Wallet, WifiOff } from "lucide-react";
import type { DashboardStatus } from "../hooks/useDashboard";
import { buildCategoriaSeries, buildFormaPagamentoSeries } from "../lib/distribution";
import { formatMonthLabel, shiftMonth } from "../lib/format";
import type { DashboardData } from "../types";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DistribuicaoChart } from "./DistribuicaoChart";
import { GastosRecorrentes } from "./GastosRecorrentes";
import { SaldoHero } from "./SaldoHero";
import { TransacoesList } from "./TransacoesList";

interface Props {
  mes: string;
  onChangeMes: (mes: string) => void;
  status: DashboardStatus;
  data: DashboardData | null;
  errorMessage: string | null;
  onRetry: () => void;
  onLogout: () => void;
  onSaveSaldoAtual: (valor: number) => Promise<void>;
  onUpdateParcelas: (gastoId: number, parcelasPagas: number) => Promise<void>;
}

export function DashboardView({
  mes,
  onChangeMes,
  status,
  data,
  errorMessage,
  onRetry,
  onLogout,
  onSaveSaldoAtual,
  onUpdateParcelas,
}: Props) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-mark">
            <Wallet size={15} strokeWidth={2} />
          </span>
          <span className="app-brand-name">Vero Contábil</span>
        </div>

        <div className="month-nav">
          <button type="button" aria-label="Mês anterior" onClick={() => onChangeMes(shiftMonth(mes, -1))}>
            <ChevronLeft size={18} />
          </button>
          <span className="month-label">{formatMonthLabel(mes)}</span>
          <button type="button" aria-label="Próximo mês" onClick={() => onChangeMes(shiftMonth(mes, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="app-actions">
          <button type="button" aria-label="Atualizar" className="icon-button" onClick={onRetry}>
            <RefreshCw size={15} />
          </button>
          <button type="button" aria-label="Sair" className="icon-button" onClick={onLogout}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="app-main">
        {status === "loading" && <DashboardSkeleton />}

        {status === "error" && (
          <div className="state-card state-card--error">
            {errorMessage?.includes("conectar") ? <WifiOff size={22} /> : <AlertTriangle size={22} />}
            <p>{errorMessage ?? "Não foi possível carregar os dados."}</p>
            <button type="button" onClick={onRetry}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === "success" && data && (
          <div className="dashboard-grid">
            <SaldoHero
              saldo={data.saldo}
              saldoAtual={data.saldo_atual}
              onSaveSaldoAtual={onSaveSaldoAtual}
              mesLabel={formatMonthLabel(mes)}
              ehProjecao={data.eh_projecao}
            />

            <section className="grid-charts">
              <DistribuicaoChart
                title="Gastos por categoria"
                items={buildCategoriaSeries(data.distribuicao_categoria)}
              />
              <DistribuicaoChart
                title="Gastos por forma de pagamento"
                items={buildFormaPagamentoSeries(data.distribuicao_forma_pagamento)}
              />
            </section>

            <section className="grid-lists">
              <TransacoesList transacoes={data.transacoes} />
              <GastosRecorrentes gastos={data.gastos_recorrentes} onUpdateParcelas={onUpdateParcelas} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
