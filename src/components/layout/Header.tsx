import { Sun, Moon, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface Props {
  user: User;
  darkMode: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export function Header({ user, darkMode, onToggleTheme, onSignOut }: Props) {
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex-shrink-0 shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="font-bold text-slate-100 text-sm tracking-tight">Minhas Contas</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-xs mr-1 hidden sm:block truncate max-w-[160px]">
            {name}
          </span>
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onSignOut}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
