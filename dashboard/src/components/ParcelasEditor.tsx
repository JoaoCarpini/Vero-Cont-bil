import { Check, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  gastoId: number;
  parcelasPagas: number;
  parcelasTotais: number;
  onUpdate: (gastoId: number, parcelasPagas: number) => Promise<void>;
}

export function ParcelasEditor({ gastoId, parcelasPagas, parcelasTotais, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(parcelasPagas));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setInput(String(parcelasPagas));
    setError(null);
    setEditing(true);
  }

  async function commit(valor: number) {
    if (!Number.isInteger(valor) || valor < 0 || valor > parcelasTotais) {
      setError(`Entre 0 e ${parcelasTotais}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdate(gastoId, valor);
      setEditing(false);
    } catch {
      setError("Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <span className="parcelas-editor is-editing">
        <input
          type="number"
          min={0}
          max={parcelasTotais}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit(Number(input));
            if (event.key === "Escape") setEditing(false);
          }}
          autoFocus
          disabled={saving}
        />
        <span className="parcelas-editor-total">/{parcelasTotais}</span>
        <button type="button" onClick={() => commit(Number(input))} disabled={saving} aria-label="Salvar">
          <Check size={11} />
        </button>
        <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancelar">
          <X size={11} />
        </button>
        {error && <span className="parcelas-editor-error">{error}</span>}
      </span>
    );
  }

  return (
    <span className="parcelas-editor">
      <button type="button" className="parcelas-editor-count" onClick={startEditing}>
        {parcelasPagas}/{parcelasTotais} parcelas
        <Pencil size={10} strokeWidth={2} className="parcelas-editor-icon" />
      </button>
      {parcelasPagas < parcelasTotais && (
        <button
          type="button"
          className="parcelas-editor-increment"
          onClick={() => commit(parcelasPagas + 1)}
          disabled={saving}
          aria-label="Marcar mais uma parcela como paga"
        >
          <Plus size={10} strokeWidth={2.5} />1
        </button>
      )}
    </span>
  );
}
