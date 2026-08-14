export interface Saldo {
  salario_base: number;
  entradas_lancadas: number;
  saidas_lancadas: number;
  gastos_recorrentes: number;
  saldo_projetado: number;
}

export interface Transacao {
  id: number;
  tipo: "entrada" | "saida";
  valor: number;
  categoria: string;
  forma_pagamento: string | null;
  data: string;
  hora: string;
  descricao: string | null;
  origem: string;
}

export interface GastoRecorrente {
  id: number;
  descricao: string;
  valor_mensal: number;
  categoria: string;
  parcelas_totais: number | null;
  parcelas_pagas: number | null;
  ativo: boolean;
}

export interface DashboardData {
  mes_referencia: string;
  saldo: Saldo;
  transacoes: Transacao[];
  distribuicao_categoria: { categoria: string; total: number }[];
  distribuicao_forma_pagamento: { forma_pagamento: string; total: number }[];
  gastos_recorrentes: GastoRecorrente[];
}
