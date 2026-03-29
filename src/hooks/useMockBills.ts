import { useState } from 'react';
import type { Bill, Payment } from '../types';
import { DEMO_BILLS, DEMO_PAYMENTS } from '../lib/mockData';

let idCounter = 100;

export function useMockBills() {
  const [bills, setBills] = useState<Bill[]>(DEMO_BILLS);
  const [payments, setPayments] = useState<Payment[]>(DEMO_PAYMENTS);
  const loading = false;
  const error = null;

  async function addBill(data: Omit<Bill, 'id' | 'created_at' | 'user_id'>) {
    const newBill: Bill = {
      ...data,
      id: `b${++idCounter}`,
      user_id: 'demo-user-001',
      created_at: new Date().toISOString(),
    };
    setBills((prev) => [...prev, newBill]);
    return { error: null };
  }

  async function updateBill(id: string, data: Partial<Bill>) {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    return { error: null };
  }

  async function deleteBill(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
    setPayments((prev) => prev.filter((p) => p.bill_id !== id));
    return { error: null };
  }

  async function addPayment(
    billId: string,
    periodKey: string,
    amount: number,
    receiptFile?: File | null
  ) {
    const payment: Payment = {
      id: `p${++idCounter}`,
      bill_id: billId,
      user_id: 'demo-user-001',
      period_key: periodKey,
      paid_at: new Date().toISOString(),
      amount,
      receipt_url: receiptFile ? URL.createObjectURL(receiptFile) : null,
      receipt_name: receiptFile?.name ?? null,
    };
    setPayments((prev) => {
      const filtered = prev.filter(
        (p) => !(p.bill_id === billId && p.period_key === periodKey)
      );
      return [payment, ...filtered];
    });
    return { error: null };
  }

  async function removePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  }

  async function attachReceipt(paymentId: string, file: File) {
    const url = URL.createObjectURL(file);
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId ? { ...p, receipt_url: url, receipt_name: file.name } : p
      )
    );
    return { error: null };
  }

  async function removeReceipt(paymentId: string) {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId ? { ...p, receipt_url: null, receipt_name: null } : p
      )
    );
    return { error: null };
  }

  async function getReceiptSignedUrl(path: string): Promise<string | null> {
    // In demo mode, path is already a blob URL
    return path;
  }

  const billsPayments = (billId: string) =>
    payments
      .filter((p) => p.bill_id === billId)
      .sort((a, b) => b.period_key.localeCompare(a.period_key));

  return {
    bills,
    payments,
    loading,
    error,
    fetchAll: async () => {},
    addBill,
    updateBill,
    deleteBill,
    addPayment,
    removePayment,
    attachReceipt,
    removeReceipt,
    getReceiptSignedUrl,
    billsPayments,
  };
}
