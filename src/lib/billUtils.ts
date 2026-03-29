import {
  format,
  getYear,
  getMonth,
  getDate,
  getDay,
  getWeek,
  setDate,
  addMonths,
  addYears,
  addDays,
  parseISO,
  differenceInCalendarDays,
  startOfWeek,
  nextDay,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bill, BillStatus, BillWithStatus, Frequency, Payment } from '../types';

// ─── Period key ────────────────────────────────────────────────────────────────

export function getCurrentPeriodKey(bill: Bill, date: Date = new Date()): string {
  const year = getYear(date);
  const month = getMonth(date) + 1; // 1-indexed

  switch (bill.frequency) {
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly': {
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    }
    case 'annual':
      return `${year}`;
    case 'weekly': {
      const week = getWeek(date, { weekStartsOn: 1 });
      return `${year}-W${String(week).padStart(2, '0')}`;
    }
    case 'one-time':
      return bill.due_day;
    default:
      return `${year}-${String(month).padStart(2, '0')}`;
  }
}

export function formatPeriodLabel(periodKey: string, frequency: Frequency): string {
  if (frequency === 'monthly' && /^\d{4}-\d{2}$/.test(periodKey)) {
    const [year, month] = periodKey.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return format(d, "MMM/yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase());
  }
  if (frequency === 'quarterly' && /^\d{4}-Q\d$/.test(periodKey)) {
    const [year, q] = periodKey.split('-Q');
    return `${q}º Tri/${year}`;
  }
  if (frequency === 'annual' && /^\d{4}$/.test(periodKey)) {
    return periodKey;
  }
  if (frequency === 'weekly' && /^\d{4}-W\d{2}$/.test(periodKey)) {
    return `Sem ${periodKey.split('-W')[1]}/${periodKey.split('-W')[0]}`;
  }
  return periodKey;
}

// ─── Next due date ──────────────────────────────────────────────────────────────

export function getNextDueDate(bill: Bill, today: Date = new Date()): Date | null {
  const todayStart = startOfDay(today);

  switch (bill.frequency) {
    case 'monthly': {
      const dueDay = parseInt(bill.due_day, 10);
      // Try this month first
      const year = getYear(todayStart);
      const month = getMonth(todayStart);
      let candidate = setDate(new Date(year, month, 1), dueDay);
      if (isBefore(candidate, todayStart)) {
        candidate = setDate(addMonths(candidate, 1), dueDay);
      }
      return candidate;
    }

    case 'quarterly': {
      const dueDay = parseInt(bill.due_day, 10);
      const month = getMonth(todayStart); // 0-indexed
      const year = getYear(todayStart);
      const quarterStartMonth = Math.floor(month / 3) * 3;
      let candidate = setDate(new Date(year, quarterStartMonth, 1), dueDay);
      if (isBefore(candidate, todayStart)) {
        candidate = setDate(addMonths(candidate, 3), dueDay);
      }
      return candidate;
    }

    case 'annual': {
      // due_day = "MM-DD"
      const [mm, dd] = bill.due_day.split('-').map(Number);
      const year = getYear(todayStart);
      let candidate = new Date(year, mm - 1, dd);
      if (isBefore(candidate, todayStart)) {
        candidate = new Date(year + 1, mm - 1, dd);
      }
      return candidate;
    }

    case 'weekly': {
      const targetWeekday = parseInt(bill.due_day, 10); // 0=Sun, 6=Sat
      const currentDay = getDay(todayStart);
      let daysUntil = (targetWeekday - currentDay + 7) % 7;
      if (daysUntil === 0) daysUntil = 0; // today
      return addDays(todayStart, daysUntil);
    }

    case 'one-time': {
      try {
        return parseISO(bill.due_day);
      } catch {
        return null;
      }
    }

    default:
      return null;
  }
}

// ─── Status ─────────────────────────────────────────────────────────────────────

export function computeBillStatus(
  bill: Bill,
  payments: Payment[],
  today: Date = new Date()
): { status: BillStatus; currentPayment: Payment | null; nextDueDate: Date | null; daysUntilDue: number | null } {
  const todayStart = startOfDay(today);
  const periodKey = getCurrentPeriodKey(bill, todayStart);
  const currentPayment = payments.find((p) => p.bill_id === bill.id && p.period_key === periodKey) ?? null;

  if (currentPayment) {
    return { status: 'paid', currentPayment, nextDueDate: null, daysUntilDue: null };
  }

  const nextDueDate = getNextDueDate(bill, todayStart);
  if (!nextDueDate) {
    return { status: 'future', currentPayment: null, nextDueDate: null, daysUntilDue: null };
  }

  const days = differenceInCalendarDays(nextDueDate, todayStart);

  let status: BillStatus;
  if (days < 0) {
    status = 'overdue';
  } else if (days <= 7) {
    status = 'due-soon';
  } else {
    status = 'future';
  }

  return { status, currentPayment: null, nextDueDate, daysUntilDue: days };
}

export function buildBillsWithStatus(bills: Bill[], payments: Payment[], today = new Date()): BillWithStatus[] {
  return bills.map((bill) => ({
    ...bill,
    ...computeBillStatus(bill, payments, today),
  }));
}

// ─── Sorting ─────────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<BillStatus, number> = {
  overdue: 0,
  'due-soon': 1,
  future: 2,
  paid: 3,
};

export function sortBills(bills: BillWithStatus[]): BillWithStatus[] {
  return [...bills].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.daysUntilDue !== null && b.daysUntilDue !== null) {
      return a.daysUntilDue - b.daysUntilDue;
    }
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

// ─── Monthly normalization ───────────────────────────────────────────────────────

export function normalizeToMonthly(bill: Bill): number {
  const amount = bill.variable_amount ? 0 : (bill.amount ?? 0);
  switch (bill.frequency) {
    case 'monthly': return amount;
    case 'weekly': return amount * (52 / 12);
    case 'quarterly': return amount / 3;
    case 'annual': return amount / 12;
    case 'one-time': return 0;
    default: return amount;
  }
}

// ─── Formatters ──────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDueLabel(bill: Bill): string {
  switch (bill.frequency) {
    case 'monthly':
    case 'quarterly':
      return `Dia ${bill.due_day}`;
    case 'weekly':
      return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][parseInt(bill.due_day, 10)] ?? '';
    case 'annual': {
      const [mm, dd] = bill.due_day.split('-');
      const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `${dd}/${monthNames[parseInt(mm, 10) - 1]}`;
    }
    case 'one-time': {
      try {
        const d = parseISO(bill.due_day);
        return format(d, "dd/MM/yyyy");
      } catch {
        return bill.due_day;
      }
    }
    default:
      return bill.due_day;
  }
}

export function formatUrgencyLabel(status: BillStatus, daysUntilDue: number | null): string {
  if (status === 'paid') return 'Pago';
  if (status === 'overdue') {
    const abs = Math.abs(daysUntilDue ?? 0);
    if (abs === 0) return 'Venceu hoje';
    return `Venceu há ${abs} dia${abs > 1 ? 's' : ''}`;
  }
  if (status === 'due-soon') {
    if (daysUntilDue === 0) return 'Vence hoje';
    if (daysUntilDue === 1) return 'Vence amanhã';
    return `Vence em ${daysUntilDue} dias`;
  }
  return `em ${daysUntilDue} dias`;
}

// ─── Receipt compression ─────────────────────────────────────────────────────────

export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas não suportado')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Falha ao comprimir imagem'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar imagem')); };
    img.src = url;
  });
}

// ─── Seed data ──────────────────────────────────────────────────────────────────

export function buildSeedBills(userId: string): Omit<Bill, 'id' | 'created_at'>[] {
  return [
    {
      user_id: userId,
      name: 'Aluguel',
      amount: 1800,
      variable_amount: false,
      frequency: 'monthly',
      due_day: '5',
      category: 'moradia',
      notes: '',
      color: '#8b5cf6',
    },
    {
      user_id: userId,
      name: 'Cartão de Crédito',
      amount: 0,
      variable_amount: true,
      frequency: 'monthly',
      due_day: '10',
      category: 'outros',
      notes: '',
      color: '#ec4899',
    },
    {
      user_id: userId,
      name: 'Netflix',
      amount: 39.9,
      variable_amount: false,
      frequency: 'monthly',
      due_day: '1',
      category: 'assinaturas',
      notes: '',
      color: '#22c55e',
    },
    {
      user_id: userId,
      name: 'Plano de Saúde',
      amount: 650,
      variable_amount: false,
      frequency: 'monthly',
      due_day: '20',
      category: 'saude',
      notes: '',
      color: '#ef4444',
    },
  ];
}
