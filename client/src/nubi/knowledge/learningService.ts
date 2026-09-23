import type {
  NubiKnowledge,
} from "./types";

import {
  learnTermFromWeb,
  type WebLearningResult,
} from "./learningClient";

import {
  rememberKnowledge,
} from "./knowledgeService";

import {
  resolveKnowledgeQuestion,
  type KnowledgeResolution,
} from "./knowledgeResolver";

const AUTO_LEARN_THRESHOLD = 0.85;

export type LearningProvider = (
  term: string,
  context: string,
) => Promise<WebLearningResult>;

export type AutoLearningResult = {
  knowledgeBase: NubiKnowledge[];

  status:
    | "learned"
    | "already-known"
    | "known"
    | "not-confident"
    | "not-found"
    | "not-question"
    | "quota"
    | "temporary"
    | "failed";

  term: string;

  knowledge: NubiKnowledge | null;

  webResult: WebLearningResult | null;

  resolution: KnowledgeResolution & {
    question: {
      isQuestion: boolean;
      term: string;
      pattern:
        | "meaning"
        | "definition"
        | "what-is"
        | "none";
    };
  };
}

/**
 * Resuelve una pregunta de conocimiento.
 *
 * Primero busca en la memoria local.
 * Si Nubi no conoce el término, consulta al Learning Agent.
 * Si la confianza es suficiente, guarda el conocimiento.
 *
 * Gemini nunca responde directamente al viewer.
 */
export async function resolveAndLearnKnowledge(
  knowledgeBase: NubiKnowledge[],
  comment: string,
  user: string,
  provider: LearningProvider = learnTermFromWeb,
): Promise<AutoLearningResult> {
  const resolution =
    resolveKnowledgeQuestion(
      knowledgeBase,
      comment,
    );

  if (!resolution.question.isQuestion) {
    return {
      knowledgeBase,
      status: "not-question",
      term: "",
      knowledge: null,
      webResult: null,
      resolution,
    };
  }

  if (
    resolution.found &&
    resolution.knowledge
  ) {
    return {
      knowledgeBase,
      status: "known",
      term: resolution.term,
      knowledge: resolution.knowledge,
      webResult: null,
      resolution,
    };
  }

  let webResult: WebLearningResult;

  try {
    webResult =
      await provider(
        resolution.term,
        comment,
      );
  } catch {
    return {
      knowledgeBase,
      status: "failed",
      term: resolution.term,
      knowledge: null,
      webResult: null,
      resolution,
    };
  }

  if (webResult.status === "quota") {
    return {
      knowledgeBase,
      status: "quota",
      term: resolution.term,
      knowledge: null,
      webResult,
      resolution,
    };
  }

  if (webResult.status === "temporary") {
    return {
      knowledgeBase,
      status: "temporary",
      term: resolution.term,
      knowledge: null,
      webResult,
      resolution,
    };
  }

  if (
    !webResult.success ||
    !webResult.known
  ) {
    return {
      knowledgeBase,
      status: "not-found",
      term: resolution.term,
      knowledge: null,
      webResult,
      resolution,
    };
  }

  if (
    webResult.confidence <
    AUTO_LEARN_THRESHOLD
  ) {
    return {
      knowledgeBase,
      status: "not-confident",
      term: resolution.term,
      knowledge: null,
      webResult,
      resolution,
    };
  }

  const remembered =
    rememberKnowledge(
      knowledgeBase,
      webResult.term,
      webResult.meaning,
      webResult.category,
      user,
      webResult.confidence,
    );

  if (
    remembered.reason ===
    "already-known"
  ) {
    return {
      knowledgeBase,
      status: "already-known",
      term: webResult.term,
      knowledge:
        remembered.knowledge,
      webResult,
      resolution,
    };
  }

  return {
    knowledgeBase:
      remembered.knowledgeBase,

    status: "learned",

    term: webResult.term,

    knowledge:
      remembered.knowledge,

    webResult,

    resolution,
  };
}

/**
 * Investiga un término concreto.
 */
export async function learnUnknownTerm(
  knowledgeBase: NubiKnowledge[],
  term: string,
  context: string,
  user: string,
  provider: LearningProvider = learnTermFromWeb,
): Promise<AutoLearningResult> {
  return resolveAndLearnKnowledge(
    knowledgeBase,
    `Nubi, ¿qué significa "${term}"? ${context}`,
    user,
    provider,
  );
}
