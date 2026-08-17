import type { DashboardData, GastoRecorrente, NovoGastoRecorrentePayload } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8123";
const STORAGE_KEY = "vero.jwt";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function login(apiKey: string): Promise<{ token: string; expires_in: number }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Chave de acesso inválida.");
  }
  if (!response.ok) {
    throw new ApiError(response.status, "Não foi possível entrar. Tente novamente.");
  }

  return response.json();
}

export async function fetchDashboard(mes: string, token: string): Promise<DashboardData> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/dashboard?mes=${mes}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    throw new ApiError(response.status, "Não foi possível carregar os dados. Tente novamente.");
  }

  return response.json();
}

export async function updateParcelasPagas(
  gastoId: number,
  parcelasPagas: number,
  token: string,
): Promise<GastoRecorrente> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gastos-recorrentes/${gastoId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ parcelas_pagas: parcelasPagas }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível salvar as parcelas.");
  }

  return response.json();
}

export async function criarGastoRecorrente(
  payload: NovoGastoRecorrentePayload,
  token: string,
): Promise<GastoRecorrente> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gastos-recorrentes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível criar o gasto recorrente.");
  }

  return response.json();
}

export async function desativarGastoRecorrente(gastoId: number, token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gastos-recorrentes/${gastoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível remover o gasto recorrente.");
  }
}

export async function deletarTransacao(transacaoId: number, token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/transacoes/${transacaoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ApiError(response.status, corpo?.detail ?? "Não foi possível remover a transação.");
  }
}

export async function updateAjusteSaldo(mes: string, valor: number, token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ajuste-saldo?mes=${mes}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ valor }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique sua conexão.");
  }

  if (response.status === 401) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    throw new ApiError(response.status, "Não foi possível salvar o ajuste de saldo.");
  }
}
