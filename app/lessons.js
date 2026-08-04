/* ==========================================================================
   What is inside a lesson: the sections and the exercises.

   This module owns the answer to "what is this lesson made of". It joins three
   sources with three different owners and one join key — the course plus the
   topic text in Portuguese:

     dados.js       the topic exists (catalogue, shared with the vitrine)
     lessons-*.js   the content sections (the portal's own)
     exercises      the assessment (from the pipeline)

   THE RULES IT APPLIES
   - A lesson with no written sections becomes ONE section. That way the portal
     behaves the same for the 85 courses that have not been written yet, and
     content lands course by course with no transition day where half the screen
     is broken.
   - The assessment is ALWAYS the last section of every lesson, whether it has
     exercises or not. The lesson's structure becomes predictable — content,
     content, …, assessment — and an empty assessment says what is coming
     instead of vanishing. It is the same principle as the reserved video frame
     on the vitrine: publishing one at a time does not rearrange anyone's screen.
   - The assessment is per TOPIC, not per section. That is what keeps `topico` as
     the join key with the pipeline — pushing the assessment down to section
     level would force a change to the format the tool emits, and it charges for
     the whole topic anyway.

   THE CONSEQUENCE OF THE ALWAYS-PRESENT ASSESSMENT, AND HOW IT IS HANDLED
   If an empty assessment counted towards progress, no course would ever reach
   100% while the exercises did not exist — and no certificate would ever be
   issued. So it is born with `contaProgresso: false` and stays out of the
   denominator until it has exercises. The denominator grows when the content
   arrives, which is honest: the lesson really did gain more work inside it.
   ========================================================================== */

import { aulasDoCurso as courseLessons } from './catalogo.js';

/* How strong the pipeline's verification marks are, in order. `criticado` went
   through probes and a judge; `execucao` had its answer key confirmed by the
   interpreter; `estrutura` only passed the mechanical checks. */
const STRENGTH = { estrutura: 0, execucao: 1, criticado: 2 };

export function lessonExercises(courseId, key, { minimo = 'estrutura' } = {}) {
  return (window.EXERCICIOS_EXEMPLO || []).filter(
    (e) => e.curso === courseId
      && e.topico === key
      && STRENGTH[e._verificacao ?? 'estrutura'] >= STRENGTH[minimo],
  );
}

export function lessonSections(courseId, key) {
  const written = window.AULAS?.[courseId]?.[key];

  const sections = written?.length
    ? written.map((s) => ({ ...s, tipo: 'conteudo' }))
    : [{ id: 'conteudo', titulo: 'Conteúdo', tipo: 'conteudo', corpo: null }];

  const exercises = lessonExercises(courseId, key);
  sections.push({
    id: 'avaliacao',
    titulo: 'Avaliação',
    tipo: 'avaliacao',
    quantos: exercises.length,
    pendente: exercises.length === 0,
    contaProgresso: exercises.length > 0,
  });
  return sections;
}

/* The sections that count towards progress. An assessment with no exercises yet
   shows on screen, so the structure stays predictable, but stays out of the
   denominator — otherwise the course would never close. */
export const countableSections = (courseId, key) =>
  lessonSections(courseId, key).filter((s) => s.contaProgresso !== false);

/* The lesson with its sections already resolved. This is what the screens
   consume. */
export function fullLesson(courseId, ix) {
  const a = courseLessons(courseId)[ix];
  if (!a) return null;
  return { ...a, secoes: lessonSections(courseId, a.chave) };
}

export const courseSections = (courseId) =>
  courseLessons(courseId).map((a) => lessonSections(courseId, a.chave));

/* The total number of sections in a course — the denominator of every bit of
   progress in the portal. Counting lessons would measure it wrong: a lesson can
   have one section or six, and the bar would move in jumps that do not match
   the effort. */
export const sectionCount = (courseId) =>
  courseLessons(courseId).reduce((s, a) => s + countableSections(courseId, a.chave).length, 0);

export const sectionIndex = (sections, secId) => {
  const i = sections.findIndex((s) => s.id === secId);
  return i < 0 ? 0 : i;
};

/* ---------- supplementary material ----------

   A section refers to material by KEY (`materiais: ['wf-dns-resumo']`), and the
   record with title, size and bytes lives in `window.MATERIAIS`. Two reasons,
   and the second is the one that matters:

   1. The same PDF serves more than one section without being duplicated.
   2. The record is what changes when the file stops being a `data:` URI and
      becomes a signed URL from a bucket, in Etapa 2. The section still says only
      the key — not one line of content has to be rewritten on that day.

   A key that is not in the registry is IGNORED, on purpose: material removed
   from the bucket must not take the whole lesson down with it. */
export const materialByKey = (key) => (window.MATERIAIS || {})[key] || null;

export const sectionMaterials = (section) =>
  (section?.materiais || []).map(materialByKey).filter(Boolean);

/* Every material in a course, without repeats — this is what the course page
   shows, for anyone who wants to download the lot instead of hunting section by
   section. */
export function courseMaterials(courseId) {
  const seen = new Set();
  const out = [];
  courseLessons(courseId).forEach((a, ix) => {
    lessonSections(courseId, a.chave).forEach((s) => {
      (s.materiais || []).forEach((key) => {
        if (seen.has(key)) return;
        const m = materialByKey(key);
        if (!m) return;
        seen.add(key);
        out.push({ ...m, chave: key, aulaIx: ix, secId: s.id, aula: a.titulo });
      });
    });
  });
  return out;
}
