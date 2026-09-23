import type {
  NubiKnowledge,
} from "./types";

import {
  loadKnowledgeBase,
  saveKnowledgeBase,
} from "./knowledgeStorage";

import {
  learnKnowledge,
} from "./learning";

const originalLocalStorage =
  globalThis.localStorage;

function createMemoryStorage() {
  const data = new Map<string, string>();

  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },

    setItem(key: string, value: string) {
      data.set(key, value);
    },

    removeItem(key: string) {
      data.delete(key);
    },

    clear() {
      data.clear();
    },

    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },

    get length() {
      return data.size;
    },
  };
}

async function testKnowledgeStorage() {
  Object.defineProperty(
    globalThis,
    "localStorage",
    {
      configurable: true,
      value: createMemoryStorage(),
    },
  );

  console.log(
    "💾 KNOWLEDGE STORAGE TEST",
  );
  console.log("");

  const empty =
    loadKnowledgeBase();

  console.log(
    "📭 MEMORIA INICIAL:",
    empty.length,
    "términos",
  );

  const learned =
    learnKnowledge(
      empty,
      "jevi",
      "Algo bueno, agradable o que gusta.",
      "slang",
      "Carlos",
      0.96,
    );

  const afterLearning =
    learned.knowledgeBase;

  console.log(
    "🧠 NUBI APRENDIÓ:",
    afterLearning.length,
    "términos",
  );

  saveKnowledgeBase(
    afterLearning,
  );

  console.log(
    "💾 MEMORIA GUARDADA.",
  );
  console.log("");

  const reloaded =
    loadKnowledgeBase();

  const jevi =
    reloaded.find(
      (entry: NubiKnowledge) =>
        entry.term === "jevi",
    );

  console.log(
    "🔄 MEMORIA RECARGADA:",
    reloaded.length,
    "términos",
  );

  console.log(
    "📖 JEVI:",
    jevi?.meaning ?? null,
  );

  console.log(
    "🎯 CONFIDENCE:",
    jevi?.confidence ?? null,
  );

  console.log("");

  if (!jevi) {
    throw new Error(
      "❌ Nubi olvidó el conocimiento.",
    );
  }

  if (
    jevi.meaning !==
    "Algo bueno, agradable o que gusta."
  ) {
    throw new Error(
      "❌ El significado guardado es incorrecto.",
    );
  }

  if (jevi.confidence !== 0.96) {
    throw new Error(
      "❌ La confianza guardada es incorrecta.",
    );
  }

  console.log(
    "✅ PERSISTENCIA COMPLETA",
  );

  if (originalLocalStorage) {
    Object.defineProperty(
      globalThis,
      "localStorage",
      {
        configurable: true,
        value: originalLocalStorage,
      },
    );
  }
}

testKnowledgeStorage().catch(
  (error) => {
    console.error(
      "❌ TEST FAILED:",
      error,
    );
  },
);
