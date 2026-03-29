import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft, TrendingDown } from 'lucide-react';

interface Props {
  onSignIn: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignUp: (email: string, password: string, name: string) => Promise<{ error: unknown }>;
  onResetPassword: (email: string) => Promise<{ error: unknown }>;
}

type View = 'login' | 'register' | 'reset';

function InputField({
  label, type = 'text', value, onChange, placeholder, required,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthPage({ onSignIn, onSignUp, onResetPassword }: Props) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reset() {
    setError('');
    setSuccess('');
    setPassword('');
  }

  function switchView(v: View) {
    reset();
    setView(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (view === 'login') {
        const { error } = await onSignIn(email, password);
        if (error) setError((error as Error).message || 'E-mail ou senha inválidos');
      } else if (view === 'register') {
        if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); setLoading(false); return; }
        const { error } = await onSignUp(email, password, name);
        if (error) setError((error as Error).message || 'Erro ao criar conta');
        else setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      } else {
        const { error } = await onResetPassword(email);
        if (error) setError((error as Error).message || 'Erro ao enviar e-mail');
        else setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-brand/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white mx-auto shadow-2xl shadow-brand/20 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1.5" />
            </div>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-brand/30 pointer-events-none" />
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Minhas <span className="text-brand">Contas</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 flex items-center justify-center gap-1.5">
            <TrendingDown size={13} className="text-brand" />
            Controle financeiro pessoal
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl shadow-black/50">
          {view === 'reset' && (
            <button
              onClick={() => switchView('login')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-5 transition-colors"
            >
              <ArrowLeft size={15} /> Voltar
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100">
              {view === 'login' ? 'Bem-vindo de volta' : view === 'register' ? 'Criar conta' : 'Recuperar senha'}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {view === 'login' && 'Entre para acessar suas finanças'}
              {view === 'register' && 'Comece a controlar suas contas hoje'}
              {view === 'reset' && 'Enviaremos um link de recuperação'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <InputField label="Nome" value={name} onChange={setName} placeholder="Seu nome completo" required />
            )}
            <InputField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
            {view !== 'reset' && (
              <InputField label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3.5">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-400 active:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand/20"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {view === 'login' ? 'Entrar' : view === 'register' ? 'Criar conta' : 'Enviar link'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 space-y-2.5 text-center">
            {view === 'login' && (
              <>
                <button
                  onClick={() => switchView('reset')}
                  className="block w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Esqueci minha senha
                </button>
                <p className="text-slate-600 text-sm">
                  Não tem conta?{' '}
                  <button onClick={() => switchView('register')} className="text-brand hover:text-brand-400 font-semibold transition-colors">
                    Cadastre-se grátis
                  </button>
                </p>
              </>
            )}
            {view === 'register' && (
              <p className="text-slate-600 text-sm">
                Já tem conta?{' '}
                <button onClick={() => switchView('login')} className="text-brand hover:text-brand-400 font-semibold transition-colors">
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-6">
          Seus dados são privados e seguros
        </p>
      </div>
    </div>
  );
}
