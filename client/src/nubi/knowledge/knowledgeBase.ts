import type {
  KnowledgeCategory,
  NubiKnowledge,
} from "./types";

function createKnowledge(
  id: string,
  term: string,
  meaning: string,
  category: KnowledgeCategory,
): NubiKnowledge {
  const now = Date.now();

  return {
    id,
    term,
    meaning,
    category,
    confidence: 1,
    timesConfirmed: 1,
    timesContradicted: 0,
    sources: [],
    firstLearnedAt: now,
    lastConfirmedAt: now,
    learnedFrom: null,
  };
}

export const initialKnowledge: NubiKnowledge[] = [
  createKnowledge(
    "word-hola",
    "hola",
    "una forma de saludar",
    "word",
  ),

  createKnowledge(
    "word-comida",
    "comida",
    "algo que se puede comer",
    "word",
  ),

  createKnowledge(
    "word-agua",
    "agua",
    "un líquido que sirve para beber",
    "word",
  ),

  createKnowledge(
    "word-abrazo",
    "abrazo",
    "una muestra de cariño en la que alguien rodea a otra persona con los brazos",
    "word",
  ),

  createKnowledge(
    "word-amor",
    "amor",
    "un sentimiento fuerte de cariño y afecto",
    "concept",
  ),
];

export function createKnowledgeBase(): NubiKnowledge[] {
  return initialKnowledge.map((knowledge) => ({
    ...knowledge,
    sources: [...knowledge.sources],
  }));
}
