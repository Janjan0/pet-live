import type {
  NubiKnowledge,
} from "./types";

import type {
  WebLearningResult,
} from "./learningClient";

import {
  resolveAndLearnKnowledge,
} from "./learningService";

async function fakeLearningProvider(
  term: string,
  context: string,
): Promise<WebLearningResult> {
  console.log("🔎 Learning Agent simulado");
  console.log("Término:", term);
  console.log("Contexto:", context);
  console.log("");

  return {
    success: true,
    status: "ok",
    known: true,
    term,
    meaning:
      "Algo bueno, agradable o que gusta.",
    category: "slang",
    confidence: 0.96,
    example:
      "Ese juego está jevi.",
    region:
      "República Dominicana",
    suggestedAction:
      "none",
    reason:
      "Resultado simulado para prueba.",
  };
}

async function testAutoLearning() {
  const knowledgeBase:
    NubiKnowledge[] = [];

  console.log(
    "🧠 AUTO LEARNING INTEGRATION TEST",
  );
  console.log("");

  const first =
    await resolveAndLearnKnowledge(
      knowledgeBase,
      'Nubi, ¿qué significa "jevi"?',
      "Carlos",
      fakeLearningProvider,
    );

  console.log("📚 PRIMERA CONSULTA");
  console.log("status:", first.status);
  console.log("term:", first.term);
  console.log(
    "confidence:",
    first.knowledge?.confidence,
  );
  console.log(
    "meaning:",
    first.knowledge?.meaning,
  );
  console.log("");

  if (!first.knowledge) {
    throw new Error(
      "❌ Nubi no aprendió el término.",
    );
  }

  const second =
    await resolveAndLearnKnowledge(
      first.knowledgeBase,
      'Nubi, ¿qué significa "jevi"?',
      "Pedro",
      async () => {
        throw new Error(
          "❌ Gemini no debería ser llamado: Nubi ya conoce el término.",
        );
      },
    );

  console.log("📚 SEGUNDA CONSULTA");
  console.log("status:", second.status);
  console.log("term:", second.term);
  console.log(
    "confidence:",
    second.knowledge?.confidence,
  );
  console.log(
    "meaning:",
    second.knowledge?.meaning,
  );
  console.log("");

  if (
    second.status !== "known"
  ) {
    throw new Error(
      "❌ Nubi no recuperó el conocimiento local.",
    );
  }

  console.log(
    "✅ APRENDIZAJE COMPLETO",
  );
}

testAutoLearning().catch(
  (error) => {
    console.error("❌ TEST FAILED:", error);
  },
);
