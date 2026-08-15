import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { NovoGastoRecorrentePayload } from "../types";

interface Props {
  onCreate: (payload: NovoGastoRecorrentePayload) => Promise<void>;
}

const CATEGORIAS_SUGERIDAS = [
  "Salário", "Alimentação", "Transporte", "Moradia", "Saúde",
  "Lazer", "Educação", "Compras", "Freela", "Assinaturas", "Outros",
];

export function NovoGastoRecorrenteForm({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valorMensal, setValorMensal] = useState("");
  const [categoria, setCategoria] = useState("");
  const [indefinido, setIndefinido] = useState(true);
  const [parcelasTotais, setParcelasTotais] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDescricao("");
    setValorMensal("");
    setCategoria("");
    setIndefinido(true);
    setParcelasTotais("");
    setError(null);
  }

  function close() {
    reset();
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const valor = Number(valorMensal.trim().replace(",", "."));
    if (!descricao.trim() || !categoria.trim() || Number.isNaN(valor) || valor <= 0) {
      setError("Preencha descrição, categoria e um valor válido");
      return;
    }

    let totais: number | null = null;
    if (!indefinido) {
      totais = Number(parcelasTotais);
      if (!Number.isInteger(totais) || totais < 1) {
        setError("Parcelas totais deve ser um número inteiro maior que zero");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate({
        descricao: descricao.trim(),
        valor_mensal: valor,
        categoria: categoria.trim(),
        parcelas_totais: totais,
        parcelas_pagas: totais !== null ? 0 : null,
      });
      close();
    } catch {
      setError("Não foi possível criar o gasto recorrente");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="novo-recorrente-toggle" onClick={() => setOpen(true)}>
        <Plus size={13} strokeWidth={2.5} />
        Novo gasto recorrente
      </button>
    );
  }

  return (
    <form className="novo-recorrente-form" onSubmit={handleSubmit}>
      <div className="novo-recorrente-row">
        <input
          type="text"
          placeholder="Descrição (ex: Netflix)"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          autoFocus
          disabled={saving}
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="R$ 29,90"
          value={valorMensal}
          onChange={(event) => setValorMensal(event.target.value)}
          disabled={saving}
        />
      </div>
      <div className="novo-recorrente-row">
        <input
          type="text"
          list="categorias-sugeridas"
          placeholder="Categoria"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          disabled={saving}
        />
        <datalist id="categorias-sugeridas">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <label className="novo-recorrente-checkbox">
          <input
            type="checkbox"
            checked={indefinido}
            onChange={(event) => setIndefinido(event.target.checked)}
            disabled={saving}
          />
          Indefinido (assinatura)
        </label>
      </div>
      {!indefinido && (
        <div className="novo-recorrente-row">
          <input
            type="number"
            min={1}
            placeholder="Total de parcelas"
            value={parcelasTotais}
            onChange={(event) => setParcelasTotais(event.target.value)}
            disabled={saving}
          />
        </div>
      )}

      {error && <span className="novo-recorrente-error">{error}</span>}

      <div className="novo-recorrente-actions">
        <button type="submit" disabled={saving}>
          Adicionar
        </button>
        <button type="button" className="novo-recorrente-cancel" onClick={close} disabled={saving} aria-label="Cancelar">
          <X size={13} />
        </button>
      </div>
    </form>
  );
}
