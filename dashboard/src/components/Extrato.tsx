import { ArrowDownLeft, ArrowUpRight, Receipt, X } from "lucide-react";
import { useState } from "react";
import type { Transacao } from "../types";
import { formaPagamentoLabel } from "../lib/distribution";
import { formatCurrency, formatDate } from "../lib/format";

interface Props {
  transacoes: Transacao[];
  onDelete: (transacaoId: number) => Promise<void>;
}

export function Extrato({ transacoes, onDelete }: Props) {
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  async function handleRemover(t: Transacao) {
    const rotulo = t.descricao?.trim() || t.categoria;
    if (!window.confirm(`Remover a transação "${rotulo}" (${formatCurrency(t.valor)})? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setRemovendoId(t.id);
    try {
      await onDelete(t.id);
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="card list-card extrato-card">
      <div className="card-header">
        <h2>Extrato do mês</h2>
        {transacoes.length > 0 && <span className="card-header-badge">{transacoes.length}</span>}
      </div>

      {transacoes.length === 0 ? (
        <div className="empty-state">
          <Receipt size={22} strokeWidth={1.5} />
          <p>Nenhuma transação lançada neste mês</p>
        </div>
      ) : (
        <ul className="transacoes-list extrato-list">
          {transacoes.map((t) => (
            <li key={t.id} className="transacao-row extrato-row">
              <div className={`transacao-icon ${t.tipo === "entrada" ? "is-good" : "is-critical"}`}>
                {t.tipo === "entrada" ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
              </div>
              <div className="transacao-main">
                <span className="transacao-categoria">{t.categoria}</span>
                <span className="transacao-descricao">
                  <span className="transacao-descricao-texto">{t.descricao ?? "Sem descrição"}</span>
                  {t.forma_pagamento && <span className="pill">{formaPagamentoLabel(t.forma_pagamento)}</span>}
                </span>
              </div>
              <div className="transacao-end">
                <span className={`transacao-valor ${t.tipo === "entrada" ? "is-good" : ""}`}>
                  {t.tipo === "entrada" ? "+" : "−"} {formatCurrency(t.valor)}
                </span>
                <span className="transacao-data">{formatDate(t.data)}</span>
              </div>
              <button
                type="button"
                className="transacao-remover"
                onClick={() => handleRemover(t)}
                disabled={removendoId === t.id}
                aria-label={`Remover transação ${t.categoria}`}
              >
                <X size={12} strokeWidth={2.25} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
