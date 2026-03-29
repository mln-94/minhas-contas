import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Bill, Payment } from '../types';
import { buildSeedBills } from '../lib/billUtils';

export function useBills(user: User | null) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [billsRes, paymentsRes] = await Promise.all([
        supabase.from('bills').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('payments').select('*').eq('user_id', user.id).order('paid_at', { ascending: false }),
      ]);
      if (billsRes.error) throw billsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      setBills((billsRes.data as Bill[]) ?? []);
      setPayments((paymentsRes.data as Payment[]) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Seed on first login
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { count } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (count === 0) {
        const seeds = buildSeedBills(user.id);
        await supabase.from('bills').insert(seeds);
      }
      fetchAll();
    })();
  }, [user, fetchAll]);

  // ─── CRUD Bills ────────────────────────────────────────────────────────────────

  async function addBill(data: Omit<Bill, 'id' | 'created_at' | 'user_id'>) {
    if (!user) return { error: 'Não autenticado' };
    const { data: inserted, error } = await supabase
      .from('bills')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (!error && inserted) setBills((prev) => [...prev, inserted as Bill]);
    return { error };
  }

  async function updateBill(id: string, data: Partial<Bill>) {
    const { data: updated, error } = await supabase
      .from('bills')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (!error && updated) setBills((prev) => prev.map((b) => (b.id === id ? (updated as Bill) : b)));
    return { error };
  }

  async function deleteBill(id: string) {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (!error) {
      setBills((prev) => prev.filter((b) => b.id !== id));
      setPayments((prev) => prev.filter((p) => p.bill_id !== id));
    }
    return { error };
  }

  // ─── CRUD Payments ──────────────────────────────────────────────────────────────

  async function addPayment(
    billId: string,
    periodKey: string,
    amount: number,
    receiptFile?: File | null
  ) {
    if (!user) return { error: 'Não autenticado' };

    let receiptUrl: string | null = null;
    let receiptName: string | null = null;

    if (receiptFile) {
      const ext = receiptFile.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${user.id}/${billId}/${periodKey}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, receiptFile, { upsert: true });
      if (uploadError) return { error: uploadError.message };
      receiptUrl = path;
      receiptName = receiptFile.name;
    }

    const { data, error } = await supabase
      .from('payments')
      .upsert(
        { bill_id: billId, user_id: user.id, period_key: periodKey, amount, receipt_url: receiptUrl, receipt_name: receiptName, paid_at: new Date().toISOString() },
        { onConflict: 'bill_id,period_key' }
      )
      .select()
      .single();

    if (!error && data) {
      setPayments((prev) => {
        const filtered = prev.filter((p) => !(p.bill_id === billId && p.period_key === periodKey));
        return [data as Payment, ...filtered];
      });
    }
    return { error };
  }

  async function removePayment(paymentId: string) {
    const payment = payments.find((p) => p.id === paymentId);
    if (payment?.receipt_url && user) {
      await supabase.storage.from('receipts').remove([payment.receipt_url]);
    }
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (!error) setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    return { error };
  }

  async function attachReceipt(paymentId: string, file: File) {
    if (!user) return { error: 'Não autenticado' };
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return { error: 'Pagamento não encontrado' };

    const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
    const path = `${user.id}/${payment.bill_id}/${payment.period_key}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };

    const { data, error } = await supabase
      .from('payments')
      .update({ receipt_url: path, receipt_name: file.name })
      .eq('id', paymentId)
      .select()
      .single();

    if (!error && data) {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? (data as Payment) : p)));
    }
    return { error };
  }

  async function removeReceipt(paymentId: string) {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment?.receipt_url) return { error: null };

    await supabase.storage.from('receipts').remove([payment.receipt_url]);
    const { data, error } = await supabase
      .from('payments')
      .update({ receipt_url: null, receipt_name: null })
      .eq('id', paymentId)
      .select()
      .single();
    if (!error && data) {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? (data as Payment) : p)));
    }
    return { error };
  }

  async function getReceiptSignedUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  const billsPayments = (billId: string) =>
    payments.filter((p) => p.bill_id === billId).sort((a, b) => b.period_key.localeCompare(a.period_key));

  return {
    bills,
    payments,
    loading,
    error,
    fetchAll,
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
