import { ArrowDownRight, ArrowUpRight, Check, Landmark, Pencil, Repeat, X } from "lucide-react";
import { useState } from "react";
import type { Saldo } from "../types";
import { formatCurrency } from "../lib/format";

interface Props {
  saldo: Saldo;
  onSaveAjusteSaldo: (valor: number) => Promise<void>;
  mesLabel: string;
  ehProjecao: boolean;
  ehMesAtual: boolean;
}

export function SaldoHero({ saldo, onSaveAjusteSaldo, mesLabel, ehProjecao, ehMesAtual }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positivo = saldo.saldo_final >= 0;
  const ajustado = Math.abs(saldo.ajuste_manual) >= 0.01;
  const label = ehProjecao ? `Projeção para ${mesLabel}` : ehMesAtual ? "Saldo atual" : `Saldo do mês · ${mesLabel}`;

  function startEditing() {
    setInput(saldo.saldo_final.toFixed(2).replace(".", ","));
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
      await onSaveAjusteSaldo(parsed - saldo.saldo_projetado);
      setEditing(false);
    } catch {
      setError("Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="saldo-hero">
      <div className="saldo-hero-main">
        <span className="saldo-hero-label">
          {label}
          {ehProjecao && <span className="saldo-hero-badge">estimado</span>}
          {ajustado && <span className="saldo-hero-badge saldo-hero-badge--ajuste">ajustado manualmente</span>}
        </span>

        {editing ? (
          <div className="saldo-hero-edit">
            <span className="saldo-hero-edit-prefix">R$</span>
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
            <button type="button" onClick={handleSave} disabled={saving} aria-label="Salvar saldo">
              <Check size={16} />
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancelar edição">
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="saldo-hero-value-row">
            <span className={`saldo-hero-value ${positivo ? "is-positive" : "is-negative"}`}>
              {formatCurrency(saldo.saldo_final)}
            </span>
            <button
              type="button"
              className="saldo-hero-edit-trigger"
              onClick={startEditing}
              aria-label="Editar saldo manualmente"
            >
              <Pencil size={14} strokeWidth={2} />
            </button>
          </span>
        )}

        {error && <span className="saldo-hero-error">{error}</span>}
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
