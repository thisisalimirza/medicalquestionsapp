import type { Enrichment } from '../types';

/**
 * Local placeholder enrichment.
 *
 * IMPORTANT: this intentionally does NOT fabricate medical facts. Inventing
 * clinical content that looks authoritative but is wrong is the worst failure
 * mode for a med-study app. Instead it builds the *scaffold* of the research —
 * a title, the questions worth answering, and lightweight tag suggestions — so
 * the UI is real and useful, and clearly labels itself as pending.
 *
 * When the Claude backend lands (M4), it returns the same `Enrichment` shape
 * with `source: 'claude'` and real, sourced content. The UI doesn't change.
 */

// Cheap, dependency-free heuristic tagging by organ system / discipline.
const TAG_RULES: { tag: string; re: RegExp }[] = [
  { tag: 'cardiology', re: /\b(heart|cardiac|cardio|ecg|ekg|arrhythmia|myocard|valve|aort)/i },
  { tag: 'neurology', re: /\b(brain|neuro|seizure|stroke|cortex|cranial|encephal|spinal)/i },
  { tag: 'pharmacology', re: /\b(drug|dose|mg|inhibitor|agonist|antagonist|receptor|pharmac)/i },
  { tag: 'microbiology', re: /\b(bacteria|virus|fungal|infection|antibiotic|sepsis|gram)/i },
  { tag: 'pathology', re: /\b(tumor|carcinoma|cancer|biopsy|lesion|necrosis|patholog)/i },
  { tag: 'biochemistry', re: /\b(enzyme|metaboli|glycol|krebs|atp|cofactor|vitamin|deficien)/i },
  { tag: 'endocrine', re: /\b(hormone|thyroid|insulin|cortisol|adrenal|pituitary|diabet)/i },
  { tag: 'renal', re: /\b(kidney|renal|nephron|glomerul|urine|electrolyte)/i },
];

function toTitle(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  const firstClause = cleaned.split(/[.?!,;]/)[0];
  const short = firstClause.length > 60 ? `${firstClause.slice(0, 57).trim()}…` : firstClause;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function buildPlaceholderEnrichment(text: string): Enrichment {
  const tags = TAG_RULES.filter((r) => r.re.test(text)).map((r) => r.tag);
  const wordCount = text.trim().split(/\s+/).length;
  const confidence = wordCount >= 8 ? 'high' : wordCount >= 4 ? 'medium' : 'low';

  return {
    title: toTitle(text),
    summary:
      'Research queued. A concise, plain-language explanation will appear here ' +
      'once the AI pipeline runs — verified against your sources, never invented.',
    clinicalRelevance:
      confidence === 'low'
        ? 'Add a few more words next time for sharper research — this fragment is brief.'
        : 'High-yield clinical framing and board relevance will be summarized here.',
    keyFacts: [
      'Definition / what it is',
      'Mechanism or cause',
      'Why it matters clinically',
      'Classic buzzwords or associations',
    ],
    suggestedTags: tags,
    confidence,
    source: 'placeholder',
    createdAt: Date.now(),
  };
}

/**
 * Simulates the async backend round-trip. Resolves after a short, jittered
 * delay so the "Researching…" state is visible and the UI feels alive.
 */
export function runEnrichment(text: string): Promise<Enrichment> {
  const delay = 700 + Math.random() * 1100;
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildPlaceholderEnrichment(text)), delay);
  });
}
