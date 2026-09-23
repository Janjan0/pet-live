import type {
  KnowledgeCategory,
  LearningResult,
  NubiKnowledge,
} from "./types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function calculateConfidence(
  confirmed: number,
  contradicted: number,
): number {
  const total = confirmed + contradicted;

  if (total <= 0) return 0;

  const raw =
    confirmed / total;

  return clamp(raw);
}

export function learnKnowledge(
  knowledgeBase: NubiKnowledge[],
  term: string,
  meaning: string,
  category: KnowledgeCategory,
  user: string,
  initialConfidence = 0.55,
  now = Date.now(),
): {
  knowledgeBase: NubiKnowledge[];
  result: LearningResult;
} {
  const normalizedTerm = normalize(term);
  const normalizedMeaning = normalize(meaning);
  const safeInitialConfidence = clamp(initialConfidence);

  if (
    !normalizedTerm ||
    !normalizedMeaning
  ) {
    throw new Error(
      "No se puede aprender conocimiento vacío.",
    );
  }

  const existingIndex =
    knowledgeBase.findIndex(
      (entry) =>
        normalize(entry.term) ===
        normalizedTerm,
    );

  if (existingIndex === -1) {
    const knowledge: NubiKnowledge = {
      id: `learned-${normalizedTerm}-${now}`,
      term,
      meaning,
      category,
      confidence: safeInitialConfidence,
      timesConfirmed: 1,
      timesContradicted: 0,
      sources: [
        {
          user,
          timestamp: now,
          confidence: safeInitialConfidence,
        },
      ],
      firstLearnedAt: now,
      lastConfirmedAt: now,
      learnedFrom: user,
    };

    return {
      knowledgeBase: [
        ...knowledgeBase,
        knowledge,
      ],
      result: {
        learned: true,
        updated: true,
        knowledge,
        reason: "new",
      },
    };
  }

  const existing =
    knowledgeBase[existingIndex];

  const sameMeaning =
    normalize(existing.meaning) ===
    normalizedMeaning;

  if (sameMeaning) {
    const timesConfirmed =
      existing.timesConfirmed + 1;

    const confidence =
      Math.min(
        0.99,
        0.55 +
          timesConfirmed * 0.12,
      );

    const knowledge: NubiKnowledge = {
      ...existing,
      confidence,
      timesConfirmed,
      lastConfirmedAt: now,
      sources: [
        ...existing.sources,
        {
          user,
          timestamp: now,
          confidence,
        },
      ].slice(-20),
    };

    const nextBase = [
      ...knowledgeBase,
    ];

    nextBase[existingIndex] =
      knowledge;

    return {
      knowledgeBase: nextBase,
      result: {
        learned: true,
        updated: true,
        knowledge,
        reason:
          timesConfirmed >= 3
            ? "strengthened"
            : "confirmed",
      },
    };
  }

  const timesContradicted =
    existing.timesContradicted + 1;

  const confidence =
    calculateConfidence(
      existing.timesConfirmed,
      timesContradicted,
    );

  const knowledge: NubiKnowledge = {
    ...existing,
    confidence,
    timesContradicted,
  };

  const nextBase = [
    ...knowledgeBase,
  ];

  nextBase[existingIndex] =
    knowledge;

  return {
    knowledgeBase: nextBase,
    result: {
      learned: false,
      updated: true,
      knowledge,
      reason: "contradicted",
    },
  };
}
