import type {
  KnowledgeCategory,
} from "./types";

import type {
  ChatAction,
} from "../../chat/interpreter";

export type WebLearningResult = {
  success: boolean;
  status:
    | "ok"
    | "quota"
    | "temporary"
    | "unknown"
    | "invalid";

  known: boolean;
  term: string;
  meaning: string;
  category: KnowledgeCategory;
  confidence: number;
  example: string;
  region: string;
  suggestedAction: ChatAction;
  reason: string;
};

const validCategories: KnowledgeCategory[] = [
  "word",
  "slang",
  "expression",
  "concept",
  "object",
  "place",
  "person",
  "meme",
  "fact",
  "other",
];

function isValidCategory(
  value: unknown,
): value is KnowledgeCategory {
  return (
    typeof value === "string" &&
    validCategories.includes(
      value as KnowledgeCategory,
    )
  );
}

export async function learnTermFromWeb(
  term: string,
  context = "",
): Promise<WebLearningResult> {
  const response = await fetch(
    "/api/learn",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        term,
        context,
      }),
    },
  );

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Learning API devolvió una respuesta inválida: ${response.status}`,
    );
  }

  const result =
    data as Partial<WebLearningResult>;

  if (!response.ok) {
    return {
      success: false,
      status:
        result.status === "quota" ||
        result.status === "temporary" ||
        result.status === "invalid"
          ? result.status
          : "unknown",
      known: false,
      term,
      meaning: "",
      category: "other",
      confidence: 0,
      example: "",
      region: "",
      suggestedAction: "none",
      reason:
        typeof result.reason === "string"
          ? result.reason
          : "No fue posible aprender el término.",
    };
  }

  return {
    success:
      result.success === true,

    status:
      result.status === "ok"
        ? "ok"
        : "unknown",

    known:
      result.known === true,

    term:
      typeof result.term === "string"
        ? result.term
        : term,

    meaning:
      typeof result.meaning === "string"
        ? result.meaning
        : "",

    category:
      isValidCategory(result.category)
        ? result.category
        : "other",

    confidence: Math.max(
      0,
      Math.min(
        1,
        typeof result.confidence ===
          "number"
          ? result.confidence
          : 0,
      ),
    ),

    example:
      typeof result.example === "string"
        ? result.example
        : "",

    region:
      typeof result.region === "string"
        ? result.region
        : "",

    suggestedAction:
      typeof result.suggestedAction === "string"
        ? result.suggestedAction as ChatAction
        : "none",

    reason:
      typeof result.reason === "string"
        ? result.reason
        : "",
  };
}
