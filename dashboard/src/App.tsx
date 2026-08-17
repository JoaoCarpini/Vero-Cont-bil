import { useEffect, useState } from "react";
import {
  ApiError,
  clearStoredToken,
  criarGastoRecorrente,
  deletarTransacao,
  desativarGastoRecorrente,
  getStoredToken,
  login,
  setStoredToken,
  updateAjusteSaldo,
  updateParcelasPagas,
} from "./api/client";
import { ApiKeyGate } from "./components/ApiKeyGate";
import { DashboardView } from "./components/DashboardView";
import { useDashboard } from "./hooks/useDashboard";
import { currentMonth } from "./lib/format";
import type { NovoGastoRecorrentePayload } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(false);
  const [mes, setMes] = useState<string>(currentMonth());
  const [tab, setTab] = useState<"dashboard" | "extrato">("dashboard");

  const { status, data, errorMessage, reload } = useDashboard(mes, token);

  useEffect(() => {
    if (status === "unauthorized") {
      clearStoredToken();
      setGateError(errorMessage ?? "Sessão expirada. Faça login novamente.");
      setToken(null);
    }
  }, [status, errorMessage]);

  async function handleGateSubmit(apiKey: string) {
    setGateError(null);
    setGateLoading(true);
    try {
      const { token: novoToken } = await login(apiKey);
      setStoredToken(novoToken);
      setToken(novoToken);
    } catch (err) {
      setGateError(err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setGateLoading(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    setToken(null);
  }

  async function handleSaveAjusteSaldo(valor: number) {
    if (!token) return;
    await updateAjusteSaldo(mes, valor, token);
    reload();
  }

  async function handleUpdateParcelas(gastoId: number, parcelasPagas: number) {
    if (!token) return;
    await updateParcelasPagas(gastoId, parcelasPagas, token);
    reload();
  }

  async function handleDeactivateGasto(gastoId: number) {
    if (!token) return;
    await desativarGastoRecorrente(gastoId, token);
    reload();
  }

  async function handleCreateGasto(payload: NovoGastoRecorrentePayload) {
    if (!token) return;
    await criarGastoRecorrente(payload, token);
    reload();
  }

  async function handleDeleteTransacao(transacaoId: number) {
    if (!token) return;
    await deletarTransacao(transacaoId, token);
    reload();
  }

  if (!token) {
    return <ApiKeyGate onSubmit={handleGateSubmit} errorMessage={gateError} loading={gateLoading} />;
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
