import type { DashboardData, GastoRecorrente, NovoGastoRecorrentePayload } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8123";
const STORAGE_KEY = "vero.api_key";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function fetchDashboard(mes: string, apiKey: string): Promise<DashboardData> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/dashboard?mes=${mes}`, {
      headers: { "X-Api-Key": apiKey },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    throw new ApiError(response.status, "Não foi possível carregar os dados. Tente novamente.");
  }

  return response.json();
}

export async function updateParcelasPagas(
  gastoId: number,
  parcelasPagas: number,
  apiKey: string,
): Promise<GastoRecorrente> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gastos-recorrentes/${gastoId}`, {
      method: "PATCH",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ parcelas_pagas: parcelasPagas }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível salvar as parcelas.");
  }

  return response.json();
}

export async function criarGastoRecorrente(
  payload: NovoGastoRecorrentePayload,
  apiKey: string,
): Promise<GastoRecorrente> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gastos-recorrentes`, {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível criar o gasto recorrente.");
  }

  return response.json();
}

export async function desativarGastoRecorrente(gastoId: number, apiKey: string): Promise<GastoRecorrente> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gastos-recorrentes/${gastoId}`, {
      method: "DELETE",
      headers: { "X-Api-Key": apiKey },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível remover o gasto recorrente.");
  }

  return response.json();
}

export async function deletarTransacao(transacaoId: number, apiKey: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/transacoes/${transacaoId}`, {
      method: "DELETE",
      headers: { "X-Api-Key": apiKey },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível remover a transação.");
  }
}

export async function updateAjusteSaldo(mes: string, valor: number, apiKey: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ajuste-saldo?mes=${mes}`, {
      method: "PUT",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ valor }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 403) {
    throw new ApiError(403, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    throw new ApiError(response.status, "Não foi possível salvar o ajuste de saldo.");
  }
}
