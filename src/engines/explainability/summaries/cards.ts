import { msg, resolveMessage } from '@/engines/explainability/templates/messages'
import type {
  EvidenceItem,
  ExplanationAudience,
  ExplanationCard,
  ExplanationObject,
  ExplanationSection,
} from '@/engines/explainability/types'

function linesFromSections(
  sections: readonly ExplanationSection[],
  ids: readonly ExplanationSection['id'][],
  limit: number,
) {
  const body = []
  for (const id of ids) {
    const section = sections.find((s) => s.id === id)
    if (!section) continue
    for (const line of section.body) {
      body.push(line)
      if (body.length >= limit) return body
    }
  }
  return body
}

export function buildExplanationCards(
  audience: ExplanationAudience,
  title: ExplanationObject['title'],
  summary: ExplanationObject['summary'],
  sections: readonly ExplanationSection[],
  evidence: readonly EvidenceItem[],
  confidence: ExplanationObject['confidence'],
): readonly ExplanationCard[] {
  const quick: ExplanationCard = Object.freeze({
    kind: 'quick',
    audience: audience === 'api' ? 'user' : audience,
    title,
    body: Object.freeze([summary, ...evidence.slice(0, 3).map((e) => e.message)]),
  })

  const detailed: ExplanationCard = Object.freeze({
    kind: 'detailed',
    audience,
    title,
    body: Object.freeze([
      summary,
      ...linesFromSections(
        sections,
        ['why_this_meal', 'why_today', 'why_not_another', 'nutrition', 'confidence'],
        10,
      ),
    ]),
  })

  const technical: ExplanationCard = Object.freeze({
    kind: 'technical',
    audience: 'developer',
    title: msg('card.technical.title', 'Technical explanation'),
    body: Object.freeze([
      msg(
        'card.technical.evidence',
        'Evidence codes: {codes}',
        {
          codes: evidence.map((e) => e.code).join(', '),
        },
      ),
      msg(
        'card.technical.confidence',
        'Confidence score={score} level={level}',
        {
          score: confidence.score ?? 'n/a',
          level: confidence.level ?? 'n/a',
        },
      ),
      ...evidence.map((e) =>
        msg('card.technical.item', '{code} ← {source}', {
          code: e.code,
          source: e.source,
        }),
      ),
    ]),
  })

  const doctor: ExplanationCard = Object.freeze({
    kind: 'doctor',
    audience: 'doctor',
    title: msg('card.doctor.title', 'Clinical-facing explanation'),
    body: Object.freeze([
      ...linesFromSections(sections, ['medical', 'nutrition', 'confidence'], 8),
      msg(
        'card.doctor.disclaimer',
        'Derived from recorded decision rules — not a clinical diagnosis',
      ),
    ]),
  })

  const developer: ExplanationCard = Object.freeze({
    kind: 'developer',
    audience: 'developer',
    title: msg('card.developer.title', 'Developer explanation'),
    body: Object.freeze([
      msg(
        'card.developer.summary',
        'summary="{text}"',
        { text: resolveMessage(summary) },
      ),
      ...technical.body,
    ]),
  })

  return Object.freeze([quick, detailed, technical, doctor, developer])
}
