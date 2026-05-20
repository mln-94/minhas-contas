import { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Copy,
  Calendar,
  MessageCircle,
  Loader2,
  Clock,
  Video,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addDays,
  startOfDay,
  isBefore,
  isAfter,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CLUB } from '../../config/club';
import { getBookedSlots, saveBooking } from '../../hooks/useBookings';

type Step = 'date' | 'time' | 'form' | 'confirm';

interface Props {
  open: boolean;
  onClose: () => void;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildGCalLink(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + CLUB.sessionDuration * 60_000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const dates = `${fmt(start)}/${fmt(end)}`;
  const title = encodeURIComponent(`${CLUB.sessionTitle} - ${CLUB.name}`);
  const details = encodeURIComponent(
    `Link Google Meet: ${CLUB.meetLink}\n\nSessão de ${CLUB.sessionDuration} minutos com o ${CLUB.name}.`
  );
  const loc = encodeURIComponent(CLUB.meetLink);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${loc}`;
}

function buildWALink(date: Date, time: string, name: string): string {
  const dateStr = format(date, 'dd/MM/yyyy', { locale: ptBR });
  const msg = encodeURIComponent(
    `Olá! Me chamo ${name} e acabei de agendar uma reunião no ${CLUB.name}.\n` +
      `📅 Data: ${dateStr}\n⏰ Horário: ${time}\n🎥 Meet: ${CLUB.meetLink}\n\nAguardo a confirmação!`
  );
  return `https://wa.me/${CLUB.whatsapp}?text=${msg}`;
}

const STEP_LABELS = ['Data', 'Horário', 'Dados', 'Confirmação'];
const STEP_KEYS: Step[] = ['date', 'time', 'form', 'confirm'];

export function SchedulerModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('date');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('date');
        setSelectedDate(null);
        setSelectedTime('');
        setForm({ name: '', email: '', whatsapp: '' });
        setError('');
        setBookedSlots([]);
        setCopied(false);
        setCurrentMonth(new Date());
      }, 300);
    }
  }, [open]);

  if (!open) return null;

  const tomorrow = startOfDay(addDays(new Date(), 1));
  const maxDate = addDays(new Date(), 60);

  function isDayAvailable(day: Date): boolean {
    return (
      (CLUB.availableDays as number[]).includes(getDay(day)) &&
      !isBefore(day, tomorrow) &&
      !isAfter(day, maxDate)
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const offset = getDay(monthStart);
  const cells = [
    ...Array(offset).fill(null),
    ...eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) }),
  ];

  async function handleSelectDate(day: Date) {
    if (!isDayAvailable(day)) return;
    setSelectedDate(day);
    setLoadingSlots(true);
    const dateStr = format(day, 'yyyy-MM-dd');
    try {
      const slots = await getBookedSlots(dateStr);
      setBookedSlots(slots);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
    setStep('time');
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
    setStep('form');
  }

  function validateForm(): string {
    if (form.name.trim().length < 2) return 'Nome deve ter ao menos 2 caracteres.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'E-mail inválido.';
    const digits = form.whatsapp.replace(/\D/g, '');
    if (digits.length < 10) return 'WhatsApp inválido. Ex: 11 99999-9999';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await saveBooking({
        name: form.name.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        booking_date: format(selectedDate!, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        meet_link: CLUB.meetLink,
      });
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(CLUB.meetLink);
      } else {
        const el = document.createElement('textarea');
        el.value = CLUB.meetLink;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }

  const currentStepIndex = STEP_KEYS.indexOf(step);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0f0f1a] border border-[#D4AF37]/20 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f1a] border-b border-[#D4AF37]/10 px-6 pt-6 pb-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-1">
                {CLUB.name}
              </p>
              <h2 className="text-white font-bold text-lg leading-tight">{CLUB.sessionTitle}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  {CLUB.sessionDuration} min
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  <Video size={12} />
                  Google Meet
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-4">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full transition-all ${
                      i <= currentStepIndex ? 'bg-[#D4AF37]' : 'bg-white/10'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      i <= currentStepIndex ? 'text-[#D4AF37]' : 'text-gray-600'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* STEP: Date */}
          {step === 'date' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-white font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const available = isDayAvailable(day);
                  const selected =
                    selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button
                      key={format(day, 'yyyy-MM-dd')}
                      onClick={() => handleSelectDate(day)}
                      disabled={!available}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                        ${selected
                          ? 'bg-[#D4AF37] text-[#080810] font-bold'
                          : available
                          ? 'text-gray-200 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] cursor-pointer'
                          : 'text-gray-600 cursor-not-allowed opacity-40'
                        }
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-gray-500 text-xs mt-4">
                Disponível: seg – sex, próximos 60 dias
              </p>
            </div>
          )}

          {/* STEP: Time */}
          {step === 'time' && selectedDate && (
            <div>
              <button
                onClick={() => setStep('date')}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
              >
                <ChevronLeft size={16} />
                Voltar
              </button>

              <p className="text-white font-semibold mb-1">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-gray-400 text-sm mb-4">Selecione um horário disponível</p>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(CLUB.timeSlots as readonly string[]).map((time) => {
                    const booked = bookedSlots.includes(time);
                    const selected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => !booked && handleSelectTime(time)}
                        disabled={booked}
                        className={`
                          py-2.5 px-2 rounded-lg text-sm font-medium transition-all border
                          ${selected
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#080810] font-bold'
                            : booked
                            ? 'border-white/5 text-gray-600 cursor-not-allowed line-through'
                            : 'border-white/10 text-gray-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer'
                          }
                        `}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP: Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit}>
              <button
                type="button"
                onClick={() => setStep('time')}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
              >
                <ChevronLeft size={16} />
                Voltar
              </button>

              {selectedDate && (
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl p-3 mb-5 flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <Calendar size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium capitalize">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {selectedTime} · {CLUB.sessionDuration} min
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#D4AF37]/5 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#D4AF37]/5 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="11 99999-9999"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#D4AF37]/5 transition-all text-sm"
                  />
                  <p className="text-gray-600 text-xs mt-1.5">Ex: 11 99999-9999</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-5 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                  bg-gradient-to-r from-[#D4AF37] to-[#b8960c] text-[#080810]
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            </form>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && selectedDate && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle size={64} className="text-emerald-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Reunião Confirmada!</h3>
              <p className="text-gray-400 text-sm mb-1 capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {selectedTime} · {CLUB.sessionDuration} minutos
              </p>

              {/* Meet link card */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-5 text-left">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                  Link Google Meet
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[#D4AF37] text-sm font-mono flex-1 truncate">
                    {CLUB.meetLink}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      copied
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'border-white/10 text-gray-400 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]'
                    }`}
                  >
                    <Copy size={12} />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <a
                  href={buildGCalLink(selectedDate, selectedTime)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                    bg-gradient-to-r from-[#D4AF37] to-[#b8960c] text-[#080810] hover:opacity-90 transition-opacity"
                >
                  <Calendar size={16} />
                  Adicionar ao Google Calendário
                </a>
                <a
                  href={buildWALink(selectedDate, selectedTime, form.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                    bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                >
                  <MessageCircle size={16} />
                  Notificar no WhatsApp
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-medium text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
