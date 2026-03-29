import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

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
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white mx-auto mb-4 shadow-xl shadow-black/30 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Minhas Contas</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão financeira pessoal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
          {view === 'reset' && (
            <button
              onClick={() => switchView('login')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}

          <h2 className="text-lg font-semibold text-slate-100 mb-1">
            {view === 'login' ? 'Entrar' : view === 'register' ? 'Criar conta' : 'Recuperar senha'}
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            {view === 'login' && 'Bem-vindo de volta!'}
            {view === 'register' && 'Crie sua conta gratuita'}
            {view === 'reset' && 'Enviaremos um link de recuperação'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <InputField label="Nome" value={name} onChange={setName} placeholder="Seu nome" required />
            )}
            <InputField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
            {view !== 'reset' && (
              <InputField label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-400 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {view === 'login' ? 'Entrar' : view === 'register' ? 'Criar conta' : 'Enviar link'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-4 space-y-2 text-center">
            {view === 'login' && (
              <>
                <button
                  onClick={() => switchView('reset')}
                  className="block w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Esqueci minha senha
                </button>
                <p className="text-slate-500 text-sm">
                  Não tem conta?{' '}
                  <button onClick={() => switchView('register')} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                    Cadastre-se
                  </button>
                </p>
              </>
            )}
            {view === 'register' && (
              <p className="text-slate-500 text-sm">
                Já tem conta?{' '}
                <button onClick={() => switchView('login')} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
