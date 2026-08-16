import { useEffect, useState } from "react";
import {
  clearStoredApiKey,
  criarGastoRecorrente,
  deletarTransacao,
  desativarGastoRecorrente,
  getStoredApiKey,
  setStoredApiKey,
  updateAjusteSaldo,
  updateParcelasPagas,
} from "./api/client";
import { ApiKeyGate } from "./components/ApiKeyGate";
import { DashboardView } from "./components/DashboardView";
import { useDashboard } from "./hooks/useDashboard";
import { currentMonth } from "./lib/format";
import type { NovoGastoRecorrentePayload } from "./types";

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => getStoredApiKey());
  const [gateError, setGateError] = useState<string | null>(null);
  const [mes, setMes] = useState<string>(currentMonth());
  const [tab, setTab] = useState<"dashboard" | "extrato">("dashboard");

  const { status, data, errorMessage, reload } = useDashboard(mes, apiKey);

  useEffect(() => {
    if (status === "unauthorized") {
      clearStoredApiKey();
      setGateError(errorMessage ?? "Chave de acesso inválida.");
      setApiKey(null);
    }
  }, [status, errorMessage]);

  function handleGateSubmit(key: string) {
    setGateError(null);
    setStoredApiKey(key);
    setApiKey(key);
  }

  function handleLogout() {
    clearStoredApiKey();
    setApiKey(null);
  }

  async function handleSaveAjusteSaldo(valor: number) {
    if (!apiKey) return;
    await updateAjusteSaldo(mes, valor, apiKey);
    reload();
  }

  async function handleUpdateParcelas(gastoId: number, parcelasPagas: number) {
    if (!apiKey) return;
    await updateParcelasPagas(gastoId, parcelasPagas, apiKey);
    reload();
  }

  async function handleDeactivateGasto(gastoId: number) {
    if (!apiKey) return;
    await desativarGastoRecorrente(gastoId, apiKey);
    reload();
  }

  async function handleCreateGasto(payload: NovoGastoRecorrentePayload) {
    if (!apiKey) return;
    await criarGastoRecorrente(payload, apiKey);
    reload();
  }

  async function handleDeleteTransacao(transacaoId: number) {
    if (!apiKey) return;
    await deletarTransacao(transacaoId, apiKey);
    reload();
  }

  if (!apiKey) {
    return <ApiKeyGate onSubmit={handleGateSubmit} errorMessage={gateError} />;
  }

  return (
    <DashboardView
      mes={mes}
      onChangeMes={setMes}
      tab={tab}
      onChangeTab={setTab}
      status={status}
      data={data}
      errorMessage={errorMessage}
      onRetry={reload}
      onLogout={handleLogout}
      onSaveAjusteSaldo={handleSaveAjusteSaldo}
      onUpdateParcelas={handleUpdateParcelas}
      onDeactivateGasto={handleDeactivateGasto}
      onCreateGasto={handleCreateGasto}
      onDeleteTransacao={handleDeleteTransacao}
    />
  );
}
