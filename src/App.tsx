import { useState, useMemo, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBills } from './hooks/useBills';
import { useMockBills } from './hooks/useMockBills';
import { useTheme } from './hooks/useTheme';
import { useActivityLogger } from './hooks/useActivityLogger';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Dashboard } from './components/dashboard/Dashboard';
import { BillsPage } from './components/bills/BillsPage';
import { PaymentModal } from './components/bills/PaymentModal';
import { AdminPage } from './components/admin/AdminPage';
import { LandingPage } from './components/club/LandingPage';
import { buildBillsWithStatus, sortBills } from './lib/billUtils';
import { isDemoMode, supabase } from './lib/supabase';
import { DEMO_USER } from './lib/mockData';
import type { BillWithStatus } from './types';
import { Loader2, FlaskConical } from 'lucide-react';

type Tab = 'dashboard' | 'bills' | 'admin';

function DemoBanner() {
  return (
    <div className="fixed top-14 left-0 right-0 z-30 bg-amber-500/90 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2">
        <FlaskConical size={14} className="text-amber-900" />
        <span className="text-amber-900 text-xs font-medium">
          Modo demo — dados não são salvos. Configure o Supabase para usar de verdade.
        </span>
      </div>
    </div>
  );
}

function AppDemo() {
  const { darkMode, toggle: toggleTheme } = useTheme(null);
  const {
    bills, payments,
    addBill, updateBill, deleteBill,
    addPayment, removePayment, attachReceipt, removeReceipt,
    billsPayments, getReceiptSignedUrl,
  } = useMockBills();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboardPayBill, setDashboardPayBill] = useState<BillWithStatus | null>(null);

  const billsWithStatus = useMemo(
    () => sortBills(buildBillsWithStatus(bills, payments)),
    [bills, payments]
  );
  const overdueCount = useMemo(
    () => billsWithStatus.filter((b) => b.status === 'overdue').length,
    [billsWithStatus]
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header user={DEMO_USER} darkMode={darkMode} onToggleTheme={toggleTheme} onSignOut={() => {}} />
      <DemoBanner />

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-24">
        {activeTab === 'dashboard' && (
          <Dashboard
            bills={billsWithStatus}
            payments={payments}
            onPayBill={setDashboardPayBill}
            onGoToBills={() => setActiveTab('bills')}
          />
        )}
        {activeTab === 'bills' && (
          <BillsPage
            bills={bills}
            payments={payments}
            onAddBill={addBill}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
            onPay={addPayment}
            onRemovePayment={removePayment}
            onAttachReceipt={attachReceipt}
            onRemoveReceipt={removeReceipt}
            billsPayments={billsPayments}
            getReceiptUrl={getReceiptSignedUrl}
          />
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} overdueCount={overdueCount} />

      <PaymentModal
        bill={dashboardPayBill}
        open={!!dashboardPayBill}
        onClose={() => setDashboardPayBill(null)}
        onPay={addPayment}
      />
    </div>
  );
}

function AppWithBackend() {
  const { user, loading: authLoading, isAdmin, signIn, signUp, resetPassword, signOut } = useAuth();
  const { darkMode, toggle: toggleTheme } = useTheme(user);
  const {
    bills, payments, loading: billsLoading,
    addBill, updateBill, deleteBill,
    addPayment, removePayment, attachReceipt, removeReceipt,
    billsPayments, getReceiptSignedUrl,
  } = useBills(user);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboardPayBill, setDashboardPayBill] = useState<BillWithStatus | null>(null);

  const billsWithStatus = useMemo(
    () => sortBills(buildBillsWithStatus(bills, payments)),
    [bills, payments]
  );
  const overdueCount = useMemo(
    () => billsWithStatus.filter((b) => b.status === 'overdue').length,
    [billsWithStatus]
  );

  // Log page visits for admin tracking (only non-admin tabs)
  useActivityLogger(
    user && !isAdmin ? user : null,
    activeTab === 'bills' ? 'bills' : 'dashboard'
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} />;
  }

  if (billsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header user={user} darkMode={darkMode} onToggleTheme={toggleTheme} onSignOut={signOut} />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24">
        {activeTab === 'dashboard' && (
          <Dashboard
            bills={billsWithStatus}
            payments={payments}
            onPayBill={setDashboardPayBill}
            onGoToBills={() => setActiveTab('bills')}
          />
        )}
        {activeTab === 'bills' && (
          <BillsPage
            bills={bills}
            payments={payments}
            onAddBill={addBill}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
            onPay={addPayment}
            onRemovePayment={removePayment}
            onAttachReceipt={attachReceipt}
            onRemoveReceipt={removeReceipt}
            billsPayments={billsPayments}
            getReceiptUrl={getReceiptSignedUrl}
          />
        )}
        {activeTab === 'admin' && isAdmin && <AdminPage />}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} overdueCount={overdueCount} isAdmin={isAdmin} />

      <PaymentModal
        bill={dashboardPayBill}
        open={!!dashboardPayBill}
        onClose={() => setDashboardPayBill(null)}
        onPay={addPayment}
      />
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────
function AppRouter() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="text-brand-400 animate-spin" />
      </div>
    );
  }

  if (isDemoMode) return <AppDemo />;
  if (isLoggedIn) return <AppWithBackend />;
  return <LandingPage />;
}

export default function App() {
  return <AppRouter />;
}
