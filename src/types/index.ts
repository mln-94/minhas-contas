export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'one-time';

export type Category =
  | 'moradia'
  | 'servicos'
  | 'assinaturas'
  | 'saude'
  | 'educacao'
  | 'transporte'
  | 'seguros'
  | 'alimentacao'
  | 'outros';

export type BillStatus = 'paid' | 'due-soon' | 'overdue' | 'future';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  variable_amount: boolean;
  frequency: Frequency;
  /** Monthly/Quarterly: "1"–"28" | Weekly: "0"–"6" | Annual: "MM-DD" | One-time: "YYYY-MM-DD" */
  due_day: string;
  category: Category;
  notes: string;
  color: string;
  created_at: string;
}

export interface Payment {
  id: string;
  bill_id: string;
  user_id: string;
  period_key: string;
  paid_at: string;
  amount: number;
  receipt_url: string | null;
  receipt_name: string | null;
}

export interface BillWithStatus extends Bill {
  status: BillStatus;
  currentPayment: Payment | null;
  nextDueDate: Date | null;
  daysUntilDue: number | null;
}

export interface UserPreferences {
  user_id: string;
  dark_mode: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  moradia: 'Moradia',
  servicos: 'Serviços',
  assinaturas: 'Assinaturas',
  saude: 'Saúde',
  educacao: 'Educação',
  transporte: 'Transporte',
  seguros: 'Seguros',
  alimentacao: 'Alimentação',
  outros: 'Outros',
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
  'one-time': 'Único',
};

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const BILL_COLORS = [
  '#f04e00', // brand orange
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#6366f1', // indigo
];
