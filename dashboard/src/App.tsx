import { useEffect, useState } from "react";
import { clearStoredApiKey, getStoredApiKey, setStoredApiKey } from "./api/client";
import { ApiKeyGate } from "./components/ApiKeyGate";
import { DashboardView } from "./components/DashboardView";
import { useDashboard } from "./hooks/useDashboard";
import { currentMonth } from "./lib/format";

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => getStoredApiKey());
  const [gateError, setGateError] = useState<string | null>(null);
  const [mes, setMes] = useState<string>(currentMonth());

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

  if (!apiKey) {
    return <ApiKeyGate onSubmit={handleGateSubmit} errorMessage={gateError} />;
  }

  return (
    <DashboardView
      mes={mes}
      onChangeMes={setMes}
      status={status}
      data={data}
      errorMessage={errorMessage}
      onRetry={reload}
      onLogout={handleLogout}
    />
  );
}
