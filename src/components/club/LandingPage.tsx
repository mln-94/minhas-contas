import { useState } from 'react';
import {
  Users,
  TrendingUp,
  Handshake,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import { CLUB } from '../../config/club';
import { SchedulerModal } from './SchedulerModal';

const ICONS: Record<string, React.ElementType> = {
  Users,
  TrendingUp,
  Handshake,
  Zap,
  Shield,
  Star,
};

export function LandingPage() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function openScheduler() {
    setMobileMenuOpen(false);
    setSchedulerOpen(true);
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#080810', color: '#fff' }}>
      {/* Sticky Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b"
        style={{
          backgroundColor: 'rgba(8,8,16,0.90)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(212,175,55,0.10)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <span
            className="text-lg font-bold tracking-tight truncate"
            style={{ color: '#D4AF37' }}
          >
            {CLUB.name}
          </span>

          {/* Desktop CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={openScheduler}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #b8960c)',
                color: '#080810',
              }}
            >
              Agendar Reunião
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={openScheduler}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #b8960c)',
                color: '#080810',
              }}
            >
              Agendar
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div
            className="sm:hidden border-t px-4 py-4"
            style={{ borderColor: 'rgba(212,175,55,0.10)', backgroundColor: '#0f0f1a' }}
          >
            <button
              onClick={openScheduler}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #b8960c)',
                color: '#080810',
              }}
            >
              Agendar Reunião Gratuita
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 min-h-screen"
        style={{
          background: `radial-gradient(ellipse at 50% -20%, rgba(212,175,55,0.12) 0%, transparent 60%), #080810`,
        }}
      >
        {/* Tag chip */}
        <div
          className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-semibold mb-6 tracking-wide"
          style={{ borderColor: 'rgba(212,175,55,0.35)', color: '#D4AF37' }}
        >
          ✦ Clube Exclusivo de Negócios
        </div>

        {/* H1 */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl">
          <span className="text-white">{CLUB.headline.split(' ').slice(0, 4).join(' ')}</span>
          <br />
          <span
            className="font-extrabold"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #f5c518, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {CLUB.headline.split(' ').slice(4).join(' ')}
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          {CLUB.description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={openScheduler}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #b8960c)',
              color: '#080810',
              boxShadow: '0 0 30px rgba(212,175,55,0.25)',
            }}
          >
            Agendar Reunião Gratuita
            <ArrowRight size={18} />
          </button>
          <button
            onClick={openScheduler}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold border transition-all hover:bg-[#D4AF37]/5"
            style={{ borderColor: 'rgba(212,175,55,0.35)', color: '#D4AF37' }}
          >
            Saiba Mais
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-yellow-400 tracking-tight">★★★★★</span>
          <span>Mais de 500 empreendedores confiam</span>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        className="border-y py-12"
        style={{
          backgroundColor: '#0f0f1a',
          borderColor: 'rgba(212,175,55,0.10)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
            {CLUB.stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center text-center relative">
                <span
                  className="text-4xl md:text-5xl font-extrabold mb-1"
                  style={{ color: '#D4AF37' }}
                >
                  {stat.value}
                </span>
                <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
                {i < CLUB.stats.length - 1 && (
                  <div
                    className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-px h-12"
                    style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4" style={{ backgroundColor: '#080810' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#D4AF37' }}
            >
              Por que fazer parte
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Uma plataforma completa de conexões, conhecimento e oportunidades para levar seu negócio ao próximo nível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLUB.benefits.map((benefit) => {
              const Icon = ICONS[benefit.icon] ?? Star;
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl p-6 transition-all group cursor-default"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(212,175,55,0.10)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.30)';
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(212,175,55,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.10)';
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.02)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(212,175,55,0.12)' }}
                  >
                    <Icon size={22} style={{ color: '#D4AF37' }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        className="py-24 px-4"
        style={{
          backgroundColor: '#0f0f1a',
          borderTop: '1px solid rgba(212,175,55,0.08)',
          borderBottom: '1px solid rgba(212,175,55,0.08)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#D4AF37' }}
            >
              Como funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simples como deveria ser
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Três passos para você estar dentro da maior rede de negócios premium do Brasil.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-4 items-start">
            {CLUB.steps.map((s, i) => (
              <div key={s.number} className="flex-1 flex flex-col md:items-center md:text-center relative">
                <div
                  className="text-6xl font-extrabold leading-none mb-4 select-none"
                  style={{ color: 'rgba(212,175,55,0.20)' }}
                >
                  {s.number}
                </div>
                <h3 className="text-white font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.description}</p>

                {/* Connector line (desktop) */}
                {i < CLUB.steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-[calc(50%+60px)] right-[-calc(50%-60px)] h-px"
                    style={{
                      background: 'linear-gradient(to right, rgba(212,175,55,0.30), rgba(212,175,55,0.05))',
                      width: 'calc(100% - 80px)',
                      left: 'calc(50% + 40px)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4" style={{ backgroundColor: '#080810' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#D4AF37' }}
            >
              Depoimentos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Quem já está dentro
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CLUB.testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: '#D4AF37', color: '#080810' }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#D4AF37" style={{ color: '#D4AF37' }} />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24 px-4"
        style={{
          backgroundColor: '#0f0f1a',
          background: `radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 65%), #0f0f1a`,
          borderTop: '1px solid rgba(212,175,55,0.10)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#D4AF37' }}
          >
            Pronto para crescer?
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Sua próxima grande parceria começa com uma conversa
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Agende uma sessão gratuita de 45 minutos e descubra como o {CLUB.name} pode acelerar seus negócios.
          </p>
          <button
            onClick={openScheduler}
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold transition-all hover:opacity-90 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #b8960c)',
              color: '#080810',
              boxShadow: '0 0 40px rgba(212,175,55,0.20)',
            }}
          >
            Agendar Reunião Gratuita
            <ArrowRight size={20} />
          </button>
          <p className="text-gray-600 text-sm mt-4">
            Sessão gratuita de 45 min · Sem compromisso
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-4"
        style={{
          backgroundColor: '#080810',
          borderTop: '1px solid rgba(212,175,55,0.10)',
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-bold text-lg mb-0.5" style={{ color: '#D4AF37' }}>
              {CLUB.name}
            </p>
            <p className="text-gray-600 text-sm">{CLUB.tagline}</p>
          </div>
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} {CLUB.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Scheduler Modal */}
      <SchedulerModal open={schedulerOpen} onClose={() => setSchedulerOpen(false)} />
    </div>
  );
}
