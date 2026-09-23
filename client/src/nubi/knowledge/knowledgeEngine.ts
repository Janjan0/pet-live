import type {
  KnowledgeQueryResult,
  NubiKnowledge,
} from "./types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function findKnowledge(
  knowledgeBase: NubiKnowledge[],
  term: string,
): KnowledgeQueryResult {
  const normalizedTerm = normalize(term);

  if (!normalizedTerm) {
    return {
      found: false,
      knowledge: null,
      confidence: 0,
    };
  }

  const exact = knowledgeBase.find(
    (entry) =>
      normalize(entry.term) === normalizedTerm,
  );

  if (!exact) {
    return {
      found: false,
      knowledge: null,
      confidence: 0,
    };
  }

  return {
    found: true,
    knowledge: exact,
    confidence: exact.confidence,
  };
}

export function searchKnowledge(
  knowledgeBase: NubiKnowledge[],
  query: string,
): NubiKnowledge[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return [];

  return knowledgeBase.filter((entry) => {
    const term = normalize(entry.term);
    const meaning = normalize(entry.meaning);

    return (
      term.includes(normalizedQuery) ||
      meaning.includes(normalizedQuery)
    );
  });
}
