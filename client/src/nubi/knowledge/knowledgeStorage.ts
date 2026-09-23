import type { NubiKnowledge } from "./types";
import { createKnowledgeBase } from "./knowledgeBase";

const STORAGE_KEY = "pet-live:nubi:knowledge:v1";

function isValidKnowledge(value: unknown): value is NubiKnowledge {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<NubiKnowledge>;

  return (
    typeof entry.id === "string" &&
    typeof entry.term === "string" &&
    typeof entry.meaning === "string" &&
    typeof entry.category === "string" &&
    typeof entry.confidence === "number" &&
    typeof entry.timesConfirmed === "number" &&
    typeof entry.timesContradicted === "number" &&
    Array.isArray(entry.sources) &&
    typeof entry.firstLearnedAt === "number" &&
    typeof entry.lastConfirmedAt === "number" &&
    (
      entry.learnedFrom === null ||
      typeof entry.learnedFrom === "string"
    )
  );
}

export function loadKnowledgeBase(): NubiKnowledge[] {
  if (typeof globalThis.localStorage === "undefined") {
    return createKnowledgeBase();
  }

  try {
    const raw = globalThis.localStorage.getItem(
      STORAGE_KEY,
    );

    if (!raw) {
      return createKnowledgeBase();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return createKnowledgeBase();
    }

    const knowledgeBase =
      parsed.filter(isValidKnowledge);

    if (knowledgeBase.length === 0) {
      return createKnowledgeBase();
    }

    return knowledgeBase;
  } catch (error) {
    console.warn(
      "⚠️ No se pudo cargar la memoria de Nubi.",
      error,
    );

    return createKnowledgeBase();
  }
}

export function saveKnowledgeBase(
  knowledgeBase: NubiKnowledge[],
): void {
  if (typeof globalThis.localStorage === "undefined") {
    return;
  }

  try {
    globalThis.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(knowledgeBase),
    );
  } catch (error) {
    console.warn(
      "⚠️ No se pudo guardar la memoria de Nubi.",
      error,
    );
  }
}

export function clearKnowledgeBase(): void {
  if (typeof globalThis.localStorage === "undefined") {
    return;
  }

  globalThis.localStorage.removeItem(
    STORAGE_KEY,
  );
}
