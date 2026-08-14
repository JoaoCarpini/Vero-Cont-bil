import { Infinity as InfinityIcon, Repeat } from "lucide-react";
import type { GastoRecorrente } from "../types";
import { formatCurrency } from "../lib/format";
import { ParcelasEditor } from "./ParcelasEditor";

interface Props {
  gastos: GastoRecorrente[];
  onUpdateParcelas: (gastoId: number, parcelasPagas: number) => Promise<void>;
}

export function GastosRecorrentes({ gastos, onUpdateParcelas }: Props) {
  return (
    <div className="card recorrentes-card">
      <div className="card-header">
        <h2>Gastos recorrentes</h2>
      </div>

      {gastos.length === 0 ? (
        <div className="empty-state">
          <Repeat size={22} strokeWidth={1.5} />
          <p>Nenhum gasto recorrente cadastrado</p>
        </div>
      ) : (
        <ul className="recorrentes-list">
          {gastos.map((g) => {
            const parcelasTotais = g.parcelas_totais;
            const indefinido = parcelasTotais == null;
            const pct = indefinido
              ? 100
              : Math.min(100, Math.round(((g.parcelas_pagas ?? 0) / parcelasTotais) * 100));

            return (
              <li key={g.id} className={`recorrente-item ${g.ativo ? "" : "is-inactive"}`}>
                <div className="recorrente-top">
                  <span className="recorrente-descricao">{g.descricao}</span>
                  <span className="recorrente-valor">{formatCurrency(g.valor_mensal)}/mês</span>
                </div>
                <div className="recorrente-meta">
                  <span className="recorrente-categoria">{g.categoria}</span>
                  {indefinido ? (
                    <span className="status-indefinido">
                      <InfinityIcon size={12} strokeWidth={2} /> indefinido
                    </span>
                  ) : (
                    <ParcelasEditor
                      gastoId={g.id}
                      parcelasPagas={g.parcelas_pagas ?? 0}
                      parcelasTotais={parcelasTotais}
                      onUpdate={onUpdateParcelas}
                    />
                  )}
                </div>
                <div className="meter-track">
                  <div
                    className={`meter-fill ${indefinido ? "meter-fill--indefinido" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!g.ativo && <span className="badge-inactive">Inativo</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
