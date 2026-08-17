import { useState, type FormEvent } from "react";
import { AlertCircle, KeyRound, Wallet } from "lucide-react";

interface Props {
  onSubmit: (key: string) => void;
  errorMessage: string | null;
  loading?: boolean;
}

export function ApiKeyGate({ onSubmit, errorMessage, loading = false }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !loading) onSubmit(trimmed);
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={handleSubmit}>
        <div className="gate-icon">
          <Wallet size={26} strokeWidth={1.75} />
        </div>
        <h1>Vero Contábil</h1>
        <p className="gate-subtitle">Entre com sua chave de acesso para ver o painel</p>

        <label className="gate-field">
          <KeyRound size={16} strokeWidth={1.75} />
          <input
            type="password"
            placeholder="Chave de acesso"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
            autoComplete="off"
            disabled={loading}
          />
        </label>

        {errorMessage && (
          <div className="gate-error">
            <AlertCircle size={14} />
            {errorMessage}
          </div>
        )}

        <button type="submit" disabled={!value.trim() || loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
