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

   `inclui` is a list of KEYS, not of sentences: they are what the server will
   authorise by, and the sentence the student reads comes from `FEATURES`. Two
   lists of text diverge the day one of them changes.
   ========================================================================== */

window.FEATURES = {
  catalogo: 'Catálogo inteiro: 86 cursos e 16 trilhas',
  trilha: 'Trilha guiada com mapa de progresso',
  exercicios: 'Exercícios e avaliações de todas as aulas',
  provas: 'Provas finais de curso e de trilha',
  certificado: 'Certificado de curso e de trilha',
  material: 'Material complementar para baixar',
  offline: 'Aulas para assistir sem conexão',
  mentoria: 'Mentoria em grupo, toda semana',
  forum: 'Fórum com resposta de instrutor',
  relatorios: 'Relatórios de turma e exportação',
  faturamento: 'Nota fiscal e faturamento por CNPJ',
};

window.PLANS = [
  {
    id: 'estudante',
    nome: 'Estudante',
    resumo: 'Para experimentar a escola inteira antes de decidir.',
    preco: 0,
    ciclo: 'para sempre',
    inclui: ['catalogo', 'trilha', 'exercicios'],
  },
  {
    id: 'pro',
    nome: 'Pro',
    resumo: 'O plano de quem está estudando para trabalhar com isto.',
    preco: 49,
    ciclo: 'por mês',
    destaque: true,
    inclui: ['catalogo', 'trilha', 'exercicios', 'provas', 'certificado', 'material', 'offline', 'forum'],
  },
  {
    id: 'equipe',
    nome: 'Equipe',
    resumo: 'Para times e escolas, com acompanhamento de turma.',
    preco: 39,
    ciclo: 'por aluno/mês',
    inclui: ['catalogo', 'trilha', 'exercicios', 'provas', 'certificado', 'material', 'offline',
      'forum', 'mentoria', 'relatorios', 'faturamento'],
  },
];
