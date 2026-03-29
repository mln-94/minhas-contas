import { LayoutDashboard, CreditCard, ShieldCheck } from 'lucide-react';

type Tab = 'dashboard' | 'bills' | 'admin';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  overdueCount: number;
  isAdmin?: boolean;
}

export function Navigation({ activeTab, onTabChange, overdueCount, isAdmin }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 safe-area-pb">
      <div className="max-w-2xl mx-auto flex">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeTab === 'dashboard' ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutDashboard size={22} />
          <span className="text-xs font-medium">Visão Geral</span>
        </button>

        <button
          onClick={() => onTabChange('bills')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
            activeTab === 'bills' ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <CreditCard size={22} />
            {overdueCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {overdueCount > 9 ? '9+' : overdueCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Contas</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onTabChange('admin')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === 'admin' ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ShieldCheck size={22} />
            <span className="text-xs font-medium">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
}
