export const CLUB = {
  name: (import.meta.env.VITE_CLUB_NAME as string) || 'Business Club Elite',
  tagline: 'Conecte-se. Colabore. Cresça.',
  headline: 'O Clube Exclusivo para Empreendedores que Pensam Grande',
  description:
    'Acesse uma rede premium de líderes, mentores e oportunidades reais. Sua próxima grande parceria começa aqui.',

  meetLink:
    (import.meta.env.VITE_CLUB_MEET_LINK as string) || 'https://meet.google.com/xxx-xxxx-xxx',
  whatsapp: (import.meta.env.VITE_CLUB_WHATSAPP as string) || '5511999999999',

  sessionDuration: 45,
  sessionTitle: 'Reunião de Alinhamento',
  sessionDescription:
    'Sessão gratuita de 45 minutos para conhecer o clube, os membros e entender como podemos acelerar seus negócios.',

  stats: [
    { value: '500+', label: 'Membros Ativos' },
    { value: 'R$2M+', label: 'Em Negócios Fechados' },
    { value: '3 anos', label: 'De Excelência' },
  ],

  benefits: [
    {
      icon: 'Users',
      title: 'Networking Premium',
      description:
        'Conecte-se com empreendedores e executivos cuidadosamente selecionados. Qualidade, não quantidade.',
    },
    {
      icon: 'TrendingUp',
      title: 'Aceleração de Negócios',
      description:
        'Estratégias práticas e mentorias para escalar sua empresa com quem já trilhou esse caminho.',
    },
    {
      icon: 'Handshake',
      title: 'Parcerias Estratégicas',
      description:
        'Encontre parceiros, investidores e clientes ideais dentro de uma comunidade que se ajuda.',
    },
    {
      icon: 'Zap',
      title: 'Eventos Exclusivos',
      description:
        'Encontros presenciais e online, masterminds e workshops com especialistas do mercado.',
    },
    {
      icon: 'Shield',
      title: 'Ambiente Confiável',
      description:
        'Comunidade fechada e selecionada. Compartilhe desafios e oportunidades com total segurança.',
    },
    {
      icon: 'Star',
      title: 'Mentorias VIP',
      description:
        'Sessões individuais com mentores em finanças, vendas, marketing e gestão estratégica.',
    },
  ],

  steps: [
    {
      number: '01',
      title: 'Agende sua Reunião',
      description:
        'Escolha o melhor horário para uma sessão gratuita de alinhamento com nossa equipe.',
    },
    {
      number: '02',
      title: 'Conheça o Clube',
      description:
        'Em 45 minutos você conhece os membros, as oportunidades e como o clube funciona.',
    },
    {
      number: '03',
      title: 'Faça Parte da Elite',
      description:
        'Após aprovação, você tem acesso completo à comunidade e todos os seus benefícios.',
    },
  ],

  testimonials: [
    {
      name: 'Carlos Mendes',
      role: 'CEO, TechStart',
      text: 'Em 3 meses de clube fechei 2 parcerias que triplicaram meu faturamento. O networking aqui é diferente de tudo que já vi.',
      initials: 'CM',
    },
    {
      name: 'Ana Beatriz Silva',
      role: 'Fundadora, ABMarketing',
      text: 'A qualidade das conexões e o nível das conversas é incomparável. Vale muito mais do que o investimento.',
      initials: 'AB',
    },
    {
      name: 'Roberto Figueiredo',
      role: 'Sócio, FigInvest',
      text: 'Encontrei aqui os melhores parceiros para expandir meu negócio. Ambiente sério com pessoas sérias.',
      initials: 'RF',
    },
  ],

  availableDays: [1, 2, 3, 4, 5] as number[],
  timeSlots: [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00',
  ],
} as const;
