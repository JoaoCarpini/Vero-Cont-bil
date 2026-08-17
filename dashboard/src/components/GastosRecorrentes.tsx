import { Infinity as InfinityIcon, Repeat, X } from "lucide-react";
import { useState } from "react";
import type { GastoRecorrente, NovoGastoRecorrentePayload } from "../types";
import { formatCurrency } from "../lib/format";
import { NovoGastoRecorrenteForm } from "./NovoGastoRecorrenteForm";
import { ParcelasEditor } from "./ParcelasEditor";

interface Props {
  gastos: GastoRecorrente[];
  onUpdateParcelas: (gastoId: number, parcelasPagas: number) => Promise<void>;
  onDeactivate: (gastoId: number) => Promise<void>;
  onCreate: (payload: NovoGastoRecorrentePayload) => Promise<void>;
}

export function GastosRecorrentes({ gastos, onUpdateParcelas, onDeactivate, onCreate }: Props) {
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  async function handleRemover(gasto: GastoRecorrente) {
    const mensagem = gasto.ativo
      ? `Remover "${gasto.descricao}" dos gastos recorrentes ativos?`
      : `Excluir "${gasto.descricao}" permanentemente?`;
    if (!window.confirm(mensagem)) return;
    setRemovendoId(gasto.id);
    try {
      await onDeactivate(gasto.id);
    } finally {
      setRemovendoId(null);
    }
  }

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
                  <span className="recorrente-top-right">
                    <span className="recorrente-valor">{formatCurrency(g.valor_mensal)}/mês</span>
                    <button
                      type="button"
                      className="recorrente-remover"
                      onClick={() => handleRemover(g)}
                      disabled={removendoId === g.id}
                      aria-label={`Remover ${g.descricao}`}
                    >
                      <X size={12} strokeWidth={2.25} />
                    </button>
                  </span>
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
                {!g.ativo && <span className="badge-inactive">Encerrado</span>}
              </li>
            );
          })}
        </ul>
      )}

      <NovoGastoRecorrenteForm onCreate={onCreate} />
    </div>
  );
}
