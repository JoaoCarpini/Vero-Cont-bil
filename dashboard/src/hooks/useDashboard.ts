import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchDashboard } from "../api/client";
import type { DashboardData } from "../types";

export type DashboardStatus = "loading" | "success" | "error" | "unauthorized";

interface UseDashboardResult {
  status: DashboardStatus;
  data: DashboardData | null;
  errorMessage: string | null;
  reload: () => void;
}

export function useDashboard(mes: string, token: string | null): UseDashboardResult {
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await fetchDashboard(mes, token);
      setData(result);
      setStatus("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus("unauthorized");
        setErrorMessage(err.message);
      } else {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Erro inesperado.");
      }
    }
  }, [mes, token]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, data, errorMessage, reload };
}
