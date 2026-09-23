import type {
  KnowledgeCategory,
  NubiKnowledge,
} from "./types";

import {
  findKnowledge,
} from "./knowledgeEngine";

import {
  learnKnowledge,
} from "./learning";

export type KnowledgeServiceResult = {
  knowledgeBase: NubiKnowledge[];

  found: boolean;
  learned: boolean;
  updated: boolean;

  knowledge: NubiKnowledge | null;

  reason:
    | "already-known"
    | "new"
    | "confirmed"
    | "strengthened"
    | "contradicted"
    | "rejected"
    | "not-found";
};

export function rememberKnowledge(
  knowledgeBase: NubiKnowledge[],
  term: string,
  meaning: string,
  category: KnowledgeCategory,
  user: string,
  now = Date.now(),
): KnowledgeServiceResult {
  const existing =
    findKnowledge(
      knowledgeBase,
      term,
    );

  if (existing.found) {
    return {
      knowledgeBase,
      found: true,
      learned: false,
      updated: false,
      knowledge: existing.knowledge,
      reason: "already-known",
    };
  }

  const result =
    learnKnowledge(
      knowledgeBase,
      term,
      meaning,
      category,
      user,
      now,
    );

  return {
    knowledgeBase:
      result.knowledgeBase,

    found: false,
    learned:
      result.result.learned,

    updated:
      result.result.updated,

    knowledge:
      result.result.knowledge,

    reason:
      result.result.reason,
  };
}
