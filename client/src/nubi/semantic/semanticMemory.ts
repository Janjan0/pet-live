import type {
  ChatAction,
} from "../../chat/interpreter";

import type {
  NubiSemanticMemory,
  SemanticLookupResult,
} from "./types";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createId(
  expression: string,
): string {
  return `semantic-${normalize(expression)
    .replace(/\s+/g, "-")
    .slice(0, 80)}-${Date.now()}`;
}

export function findSemanticMemory(
  memories: NubiSemanticMemory[],
  expression: string,
): SemanticLookupResult {
  const normalized =
    normalize(expression);

  if (!normalized) {
    return {
      found: false,
      memory: null,
      confidence: 0,
    };
  }

  const memory =
    memories.find(
      (item) =>
        normalize(item.expression) ===
          normalized &&
        /*
         * Las memorias pendientes existen para que Nubi
         * no olvide la expresión, pero todavía NO cuentan
         * como conocimiento aprendido.
         *
         * Compatibilidad:
         * memorias antiguas sin "status" se consideran
         * automáticamente aprendidas.
         */
        item.status !== "pending",
    );

  if (!memory) {
    return {
      found: false,
      memory: null,
      confidence: 0,
    };
  }

  return {
    found: true,
    memory,
    confidence: memory.confidence,
  };
}

export function rememberSemanticMemory(
  memories: NubiSemanticMemory[],
  expression: string,
  meaning: string,
  action: ChatAction | null,
  user: string,
  confidence: number,
): NubiSemanticMemory[] {
  const cleanExpression =
    expression.trim();

  const normalized =
    normalize(cleanExpression);

  if (!normalized) {
    return memories;
  }

  const existingIndex =
    memories.findIndex(
      (item) =>
        normalize(item.expression) ===
        normalized,
    );

  const now = Date.now();

  if (existingIndex >= 0) {
    const existing =
      memories[existingIndex];

    const updated: NubiSemanticMemory = {
      ...existing,

      meaning:
        meaning.trim() ||
        existing.meaning,

      action:
        action ?? existing.action,

      confidence:
        Math.max(
          existing.confidence,
          Math.min(1, confidence),
        ),

      timesConfirmed:
        existing.timesConfirmed + 1,

      lastUsedAt: now,

      sources: [
        ...existing.sources,
        {
          user,
          timestamp: now,
          confidence,
        },
      ].slice(-20),
    };

    return memories.map(
      (item, index) =>
        index === existingIndex
          ? updated
          : item,
    );
  }

  const memory: NubiSemanticMemory = {
    id: createId(cleanExpression),
    status: "learned",
    expression: cleanExpression,
    meaning: meaning.trim(),
    action,
    confidence:
      Math.max(
        0,
        Math.min(1, confidence),
      ),
    timesUsed: 0,
    timesConfirmed: 1,
    sources: [
      {
        user,
        timestamp: now,
        confidence,
      },
    ],
    firstLearnedAt: now,
    lastUsedAt: now,
    learnedFrom: user || null,
  };

  return [
    ...memories,
    memory,
  ];
}

export function useSemanticMemory(
  memory: NubiSemanticMemory,
): NubiSemanticMemory {
  return {
    ...memory,
    timesUsed:
      memory.timesUsed + 1,
    lastUsedAt: Date.now(),
  };
}


/*
 * Guarda una expresión que Nubi intentó aprender pero
 * no pudo resolver todavía.
 *
 * Una memoria "pending" NO se considera conocimiento.
 * Solo sirve para que Nubi conserve la expresión y
 * podamos procesarla posteriormente.
 */
export function rememberPendingSemanticMemory(
  memories: NubiSemanticMemory[],
  expression: string,
  user: string,
): NubiSemanticMemory[] {
  const cleanExpression =
    expression.trim();

  const normalized =
    normalize(cleanExpression);

  if (!normalized) {
    return memories;
  }

  const now = Date.now();

  const existingIndex =
    memories.findIndex(
      (item) =>
        normalize(item.expression) ===
        normalized,
    );

  if (existingIndex >= 0) {
    const existing =
      memories[existingIndex];

    /*
     * Si ya fue aprendida, jamás la degradamos
     * nuevamente a pending.
     */
    if (existing.status !== "pending") {
      return memories;
    }

    const updated: NubiSemanticMemory = {
      ...existing,
      status: "pending",
      timesConfirmed:
        existing.timesConfirmed + 1,
      lastUsedAt: now,
      sources: [
        ...existing.sources,
        {
          user,
          timestamp: now,
          confidence: 0,
        },
      ].slice(-20),
    };

    return memories.map(
      (item, index) =>
        index === existingIndex
          ? updated
          : item,
    );
  }

  const pendingMemory: NubiSemanticMemory = {
    id: createId(cleanExpression),
    status: "pending",
    expression: cleanExpression,
    meaning: "",
    action: null,
    confidence: 0,
    timesUsed: 0,
    timesConfirmed: 1,
    sources: [
      {
        user,
        timestamp: now,
        confidence: 0,
      },
    ],
    firstLearnedAt: now,
    lastUsedAt: now,
    learnedFrom: user || null,
  };

  return [
    ...memories,
    pendingMemory,
  ];
}
