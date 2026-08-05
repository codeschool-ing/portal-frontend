/* ==========================================================================
   Plans.

   DELIBERATE FICTION, WITH THE RIGHT SHAPE. There is no billing in this
   repository and there will not be: price, cycle, coupon and invoice belong to a
   payment service, and the portal only needs to know what the student subscribed
   to and what that entitles them to. What is here is the SHAPE of that record —
   it is what Stage 2 will fill in with real data.

   THE PORTAL LOCKS NOTHING BY PLAN, TODAY. The plan screen shows what each one
   includes, but no course, exam or certificate is blocked. Blocking is a business
   decision and requires a server: with the state in localStorage, any lock would
   be theatre — you would only have to edit a key. Better not to pretend.

   `includes` is a list of KEYS, not of sentences: they are what the server will
   authorise by, and the sentence the student reads comes from `FEATURES`. Two
   lists of text diverge the day one of them changes.
   ========================================================================== */

window.FEATURES = {
  catalogue: 'Catálogo inteiro: 86 cursos e 16 trilhas',
  track: 'Trilha guiada com mapa de progresso',
  exercises: 'Exercícios e avaliações de todas as aulas',
  exams: 'Provas finais de curso e de trilha',
  certificate: 'Certificado de curso e de trilha',
  material: 'Material complementar para baixar',
  offline: 'Aulas para assistir sem conexão',
  mentoring: 'Mentoria em grupo, toda semana',
  forum: 'Fórum com resposta de instrutor',
  reports: 'Relatórios de turma e exportação',
  invoicing: 'Nota fiscal e faturamento por CNPJ',
};

window.PLANS = [
  {
    id: 'estudante',
    name: 'Estudante',
    summary: 'Para experimentar a escola inteira antes de decidir.',
    price: 0,
    cycle: 'para sempre',
    includes: ['catalogue', 'track', 'exercises'],
  },
  {
    id: 'pro',
    name: 'Pro',
    summary: 'O plano de quem está estudando para trabalhar com isto.',
    price: 49,
    cycle: 'por mês',
    highlight: true,
    includes: ['catalogue', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline', 'forum'],
  },
  {
    id: 'equipe',
    name: 'Equipe',
    summary: 'Para times e escolas, com acompanhamento de turma.',
    price: 39,
    cycle: 'por aluno/mês',
    includes: ['catalogue', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline',
      'forum', 'mentoring', 'reports', 'invoicing'],
  },
];
