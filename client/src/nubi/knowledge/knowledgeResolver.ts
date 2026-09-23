import type {
  NubiKnowledge,
} from "./types";

import {
  findKnowledge,
} from "./knowledgeEngine";

export type KnowledgeQuestion = {
  isQuestion: boolean;
  term: string;
  pattern:
    | "meaning"
    | "definition"
    | "what-is"
    | "none";
};

export type KnowledgeResolution = {
  found: boolean;
  term: string;
  knowledge: NubiKnowledge | null;
};


/**
 * Detecta preguntas cuyo objetivo principal es conocer
 * el significado o definición de algo.
 */
export function detectKnowledgeQuestion(
  comment: string,
): KnowledgeQuestion {
  const text = comment.trim();

  if (!text) {
    return {
      isQuestion: false,
      term: "",
      pattern: "none",
    };
  }

  const patterns: Array<{
    regex: RegExp;
    pattern: KnowledgeQuestion["pattern"];
  }> = [
    {
      regex:
        /(?:que|qué)\s+significa\s+["“']?(.+?)["”']?\??$/i,
      pattern: "meaning",
    },
    {
      regex:
        /(?:que|qué)\s+quiere\s+decir\s+["“']?(.+?)["”']?\??$/i,
      pattern: "definition",
    },
    {
      regex:
        /(?:que|qué)\s+es\s+["“']?(.+?)["”']?\??$/i,
      pattern: "what-is",
    },
    {
      regex:
        /(?:que|qué)\s+es\s+lo\s+que\s+significa\s+["“']?(.+?)["”']?\??$/i,
      pattern: "meaning",
    },
  ];

  const withoutNubi = text
    .replace(
      /^\s*nubi[\s,:-]*/i,
      "",
    )
    .trim();

  for (const entry of patterns) {
    const match =
      withoutNubi.match(entry.regex);

    if (!match?.[1]) {
      continue;
    }

    const term = match[1]
      .replace(/[?!.]+$/g, "")
      .replace(/^["“']+|["”']+$/g, "")
      .trim();

    if (!term) {
      continue;
    }

    return {
      isQuestion: true,
      term,
      pattern: entry.pattern,
    };
  }

  return {
    isQuestion: false,
    term: "",
    pattern: "none",
  };
}

/**
 * Busca primero en la memoria local de Nubi.
 * No llama a Gemini.
 */
export function resolveKnowledge(
  knowledgeBase: NubiKnowledge[],
  term: string,
): KnowledgeResolution {
  const cleanTerm = term.trim();

  if (!cleanTerm) {
    return {
      found: false,
      term: "",
      knowledge: null,
    };
  }

  const result =
    findKnowledge(
      knowledgeBase,
      cleanTerm,
    );

  return {
    found: result.found,
    term: cleanTerm,
    knowledge: result.knowledge,
  };
}

/**
 * Atajo para resolver directamente un comentario.
 */
export function resolveKnowledgeQuestion(
  knowledgeBase: NubiKnowledge[],
  comment: string,
): KnowledgeResolution & {
  question: KnowledgeQuestion;
} {
  const question =
    detectKnowledgeQuestion(comment);

  if (!question.isQuestion) {
    return {
      question,
      found: false,
      term: "",
      knowledge: null,
    };
  }

  const resolution =
    resolveKnowledge(
      knowledgeBase,
      question.term,
    );

  return {
    question,
    ...resolution,
  };
}
