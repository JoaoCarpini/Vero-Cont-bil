import { Check, Pencil, Wallet, X } from "lucide-react";
import { useState } from "react";
import type { SaldoAtual } from "../types";
import { formatCurrency, formatRelativeTime } from "../lib/format";

interface Props {
  saldoAtual: SaldoAtual | null;
  onSave: (valor: number) => Promise<void>;
}

export function SaldoAtualRow({ saldoAtual, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setInput(saldoAtual ? String(saldoAtual.valor).replace(".", ",") : "");
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    const parsed = Number(input.trim().replace(",", "."));
    if (Number.isNaN(parsed)) {
      setError("Valor inválido");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parsed);
      setEditing(false);
    } catch {
      setError("Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="saldo-atual-row is-editing">
        <span className="saldo-atual-icon">
          <Wallet size={14} strokeWidth={2} />
        </span>
        <div className="saldo-atual-edit-block">
          <span className="saldo-atual-label">Saldo atual</span>
          <div className="saldo-atual-edit">
            <span className="saldo-atual-prefix">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
                if (event.key === "Escape") setEditing(false);
              }}
              autoFocus
              disabled={saving}
            />
            <button type="button" onClick={handleSave} disabled={saving} aria-label="Salvar">
              <Check size={14} />
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancelar">
              <X size={14} />
            </button>
          </div>
          {error && <span className="saldo-atual-error">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="saldo-atual-row" onClick={startEditing}>
      <span className="saldo-atual-icon">
        <Wallet size={14} strokeWidth={2} />
      </span>
      <span className="saldo-atual-text">
        <span className="saldo-atual-label">Saldo atual</span>
        <span className="saldo-atual-value-row">
          <span className="saldo-atual-value">
            {saldoAtual ? formatCurrency(saldoAtual.valor) : "Não informado"}
          </span>
          {saldoAtual && (
            <>
              <span className="saldo-atual-dot">·</span>
              <span className="saldo-atual-time">{formatRelativeTime(saldoAtual.atualizado_em)}</span>
            </>
          )}
        </span>
      </span>
      <Pencil size={12} strokeWidth={2} className="saldo-atual-edit-icon" />
    </button>
  );
}
