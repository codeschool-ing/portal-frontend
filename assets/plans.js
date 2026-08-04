/* ==========================================================================
   Planos.

   FICÇÃO DELIBERADA, COM A FORMA CERTA. Não existe cobrança neste repositório e
   não vai existir: preço, ciclo, cupom e nota fiscal são domínio de um serviço
   de pagamento, e o portal só precisa saber o que o aluno assinou e o que isso
   dá direito. O que está aqui é a FORMA desse registro — é ela que a Etapa 2
   vai preencher com dado real.

   O PORTAL NÃO TRANCA NADA POR PLANO, HOJE. A tela de plano mostra o que cada
   um inclui, mas nenhum curso, prova ou certificado é bloqueado. Bloquear é
   decisão de negócio e exige servidor: com o estado em localStorage, qualquer
   trava seria teatro — bastaria editar uma chave. Melhor não fingir.

   `inclui` é uma lista de CHAVES, não de frases: é por elas que o servidor vai
   autorizar, e a frase que o aluno lê sai de `FEATURES`. Duas listas de texto
   divergem no dia em que uma delas muda.
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
