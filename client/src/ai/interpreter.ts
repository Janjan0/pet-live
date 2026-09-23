
import type { ChatAction } from "../chat/interpreter";
import type {
  AIContext,
  AIInterpretation,
  AISentiment,
} from "./types";

const validActions: ChatAction[] = [
  "feed",
  "drink",
  "pet",
  "hug",
  "kiss",
  "play",
  "dance",
  "sleep",
  "wake",
  "bath",
  "toilet",
  "greet",
  "laugh",
  "comfort",
  "tease",
  "none",
];


function isValidSentiment(
  value: unknown,
): value is AISentiment {
  return (
    value === "positive" ||
    value === "negative" ||
    value === "neutral" ||
    value === "playful"
  );
}

function isValidAction(value: unknown): value is ChatAction {
  return (
    typeof value === "string" &&
    validActions.includes(value as ChatAction)
  );
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim();
}

/*
 * Gemini puede entender frases que el intérprete local
 * todavía no conoce, pero no debe poder inventar una acción
 * para texto completamente absurdo.
 *
 * Esta barrera busca señales mínimas compatibles con la
 * acción propuesta por Gemini.
 */
function actionHasEvidence(
  action: ChatAction,
  comment: string,
): boolean {
  const text = normalize(comment);

  const evidence: Record<ChatAction, string[]> = {
    feed: [
      "come",
      "comer",
      "comida",
      "aliment",
      "hambre",
      "hambr",
      "jarto",
      "harto",
      "ñam",
      "manzana",
      "pizza",
      "carne",
      "pan",
      "🍎",
      "🍔",
      "🍕",
      "🍗",
      "🍖",
      "🍰",
    ],

    drink: [
      "agua",
      "beber",
      "bebe",
      "sed",
      "toma",
      "hidrata",
      "💧",
      "🥤",
    ],

    pet: [
      "acaricia",
      "acariciar",
      "caricia",
      "mimo",
      "mimos",
      "acaricial",
      "🥰",
    ],

    hug: [
      "abrazo",
      "abraz",
      "🤗",
    ],

    kiss: [
      "beso",
      "besame",
      "bésame",
      "besar",
      "😘",
      "💋",
    ],

    play: [
      "juega",
      "jugar",
      "juguemos",
      "juguete",
      "diviert",
      "juego",
      "🎮",
      "🧸",
      "⚽",
    ],

    dance: [
      "baila",
      "bailar",
      "baile",
      "💃",
      "🕺",
    ],

    sleep: [
      "duerme",
      "dormir",
      "dormite",
      "descansa",
      "descansar",
      "sueno",
      "sueño",
      "😴",
      "💤",
    ],

    wake: [
      "despierta",
      "despertar",
      "despert",
      "levantate",
      "levanta",
    ],

    bath: [
      "baña",
      "bana",
      "bañ",
      "ban",
      "ducha",
      "limpia",
      "lav",
      "🚿",
      "🛁",
    ],

    toilet: [
      "popi",
      "popo",
      "popó",
      "orinar",
      "pipí",
      "pipi",
      "caca",
      "defec",
      "inodoro",
      "retrete",
      "ir al baño",
      "ve al baño",
      "🚽",
      "💩",
    ],

    greet: [
      "hola",
      "hey",
      "buenas",
      "saludo",
      "buenos dias",
      "buenas tardes",
      "buenas noches",
      "👋",
      "🙋",
    ],

    laugh: [
      "rie",
      "ríe",
      "risa",
      "reir",
      "reír",
      "jaja",
      "jeje",
      "😂",
      "🤣",
    ],

    comfort: [
      "consuel",
      "anima",
      "pobrecito",
      "pobrecita",
      "no llores",
      "tranquilo",
      "tranquila",
      "🥺",
    ],

    tease: [
      "molesta",
      "molestar",
      "burl",
      "tease",
      "fastidia",
      "fastidiar",
      "😈",
    ],

    none: [],
  };

  const signals = evidence[action] ?? [];

  return signals.some((signal) => {
    const normalizedSignal = normalize(signal);

    /*
     * Las frases completas pueden buscarse directamente.
     * Para palabras individuales usamos límites de palabra
     * para evitar falsos positivos como:
     *
     * ñam → ñambrú
     * comida → comidax
     * hola → holaaa123
     */
    if (normalizedSignal.includes(" ")) {
      return text.includes(normalizedSignal);
    }

    const escaped = normalizedSignal.replace(
      /[.*+?^${}()|[\\]\\]/g,
      "\\$&",
    );

    const regex = new RegExp(
      `(?:^|\\s|[^\\p{L}\\p{N}])${escaped}(?=$|\\s|[^\\p{L}\\p{N}])`,
      "iu",
    );

    return regex.test(text);
  });
}

export async function interpretWithAI(
  context: AIContext,
): Promise<AIInterpretation> {
  const response = await fetch("/api/interpret", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    throw new Error(`AI interpreter error: ${response.status}`);
  }

  const data = await response.json();

  if (!isValidAction(data.action)) {
    return {
      action: "none",
      confidence: 0,
      reason: "La IA devolvió una acción desconocida.",
      sentiment: "neutral",
      addressedToNubi: false,
    };
  }

  const rawConfidence =
    typeof data.confidence === "number"
      ? Math.max(0, Math.min(1, data.confidence))
      : 0;

  /*
   * La IA propone la acción, pero la evidencia del comentario
   * decide si esa acción puede llegar al Brain.
   */
  const action =
    data.action === "none" ||
    actionHasEvidence(data.action, context.comment)
      ? data.action
      : "none";

  const reason =
    action === "none" &&
    data.action !== "none"
      ? "La IA propuso una acción sin evidencia suficiente en el comentario."
      : typeof data.reason === "string"
        ? data.reason
        : undefined;

  return {
    action,
    confidence:
      action === "none"
        ? 0
        : rawConfidence,
    reason,
    sentiment: isValidSentiment(data.sentiment)
      ? data.sentiment
      : "neutral",
    addressedToNubi:
      typeof data.addressedToNubi === "boolean"
        ? data.addressedToNubi
        : false,
  };
}
