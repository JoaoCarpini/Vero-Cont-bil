import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import type { Transacao } from "../types";
import { formaPagamentoLabel } from "../lib/distribution";
import { formatCurrency, formatDate } from "../lib/format";

interface Props {
  transacoes: Transacao[];
}

export function TransacoesList({ transacoes }: Props) {
  return (
    <div className="card list-card">
      <div className="card-header">
        <h2>Transações do mês</h2>
        {transacoes.length > 0 && <span className="card-header-badge">{transacoes.length}</span>}
      </div>

      {transacoes.length === 0 ? (
        <div className="empty-state">
          <Receipt size={22} strokeWidth={1.5} />
          <p>Nenhuma transação lançada neste mês</p>
        </div>
      ) : (
        <ul className="transacoes-list">
          {transacoes.map((t) => (
            <li key={t.id} className="transacao-row">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
