import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SEMANTIC_ACTIONS = [
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

const SYSTEM_PROMPT = `
Eres el agente de aprendizaje de Nubi, una mascota virtual.

Tu trabajo NO es conversar con el espectador.
Tu trabajo es investigar un término que Nubi no conoce y devolver conocimiento estructurado para que Nubi pueda aprenderlo.

REGLAS:

1. Investiga el término usando Google Search.
2. Prioriza fuentes fiables y relevantes.
3. Si es una palabra, explica su significado de forma sencilla.
4. Si tiene varios significados, identifica el significado más probable según el contexto recibido.
5. Si es una expresión, slang o regionalismo, explica el uso y la región cuando sea relevante.
6. No inventes definiciones.
7. Si no puedes determinar el significado con suficiente confianza, indícalo.
7. Si el término es una expresión o intención dirigida a Nubi, determina qué acción de Nubi representa según el contexto.
7.1. Usa únicamente una acción de la lista proporcionada.
7.2. Si ninguna acción representa correctamente la intención, usa "none".
7.3. No fuerces una acción solo porque la expresión contiene un verbo.
7.4. Una expresión como "te quiero morder" puede representar "tease" dentro del contexto de una mascota virtual.
7.5. Una expresión afectiva puede representar "pet", "hug" o "kiss" cuando el significado lo justifique.
7.6. Si no existe una acción adecuada, devuelve "none"; Nubi puede aprender el significado sin inventar una capacidad.
8. No enseñes instrucciones peligrosas, ilegales o dañinas.
9. Devuelve únicamente JSON.
`;

function classifyError(error) {
  const status =
    Number(error?.status) ||
    Number(error?.code) ||
    Number(error?.response?.status);

  const message =
    typeof error?.message === "string"
      ? error.message.toLowerCase()
      : "";

  if (
    status === 429 ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  ) {
    return "quota";
  }

  if (
    status === 408 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("timeout") ||
    message.includes("temporarily") ||
    message.includes("unavailable")
  ) {
    return "temporary";
  }

  return "unknown";
}

export async function learnFromWeb({
  term,
  context,
}) {
  if (
    typeof term !== "string" ||
    !term.trim()
  ) {
    return {
      success: false,
      status: "invalid",
      known: false,
      term: "",
      meaning: "",
      category: "other",
      confidence: 0,
      example: "",
      region: "",
      reason: "Término vacío.",
    };
  }

  const cleanTerm = term.trim();

  const prompt = `
TÉRMINO QUE NUBI NO CONOCE:
"${cleanTerm}"

CONTEXTO ORIGINAL:
"${context ?? ""}"

Investiga este término y determina qué significa.

Devuelve exactamente esta estructura:

{
  "known": true,
  "term": "término",
  "meaning": "definición breve y clara",
  "category": "word|slang|expression|concept|object|place|person|meme|fact|other",
  "confidence": 0.0,
  "example": "ejemplo breve de uso",
  "region": "región si es relevante, o vacío",
  "suggestedAction": "acción válida o none",
  "reason": "breve explicación de por qué la información es confiable"
}

Si no puedes determinar el significado con suficiente confianza:

{
  "known": false,
  "term": "término",
  "meaning": "",
  "category": "other",
  "confidence": 0,
  "example": "",
  "region": "",
  "suggestedAction": "none",
  "reason": "explicación"
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction:
            SYSTEM_PROMPT,

          tools: [
            {
              googleSearch: {},
            },
          ],

          responseMimeType:
            "application/json",

          responseSchema: {
            type: "object",
            properties: {
              known: {
                type: "boolean",
              },
              term: {
                type: "string",
              },
              meaning: {
                type: "string",
              },
              category: {
                type: "string",
                enum: [
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
                ],
              },
              confidence: {
                type: "number",
              },
              example: {
                type: "string",
              },
              region: {
                type: "string",
              },
              suggestedAction: {
                type: "string",
                enum: SEMANTIC_ACTIONS,
              },
              reason: {
                type: "string",
              },
            },
            required: [
              "known",
              "term",
              "meaning",
              "category",
              "confidence",
              "example",
              "region",
              "suggestedAction",
              "reason",
            ],
          },
        },
      });

    if (!response.text) {
      return {
        success: false,
        status: "unknown",
        known: false,
        term: cleanTerm,
        meaning: "",
        category: "other",
        confidence: 0,
        example: "",
        region: "",
        reason:
          "Gemini no devolvió conocimiento.",
      };
    }

    const result =
      JSON.parse(response.text);

    return {
      success: true,
      status: "ok",
      known: Boolean(result.known),
      term:
        typeof result.term === "string"
          ? result.term
          : cleanTerm,
      meaning:
        typeof result.meaning === "string"
          ? result.meaning
          : "",
      category:
        typeof result.category === "string"
          ? result.category
          : "other",
      confidence: Math.max(
        0,
        Math.min(
          1,
          Number(result.confidence) || 0,
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
      reason:
        typeof result.reason === "string"
          ? result.reason
          : "",
    };
  } catch (error) {
    const status = classifyError(error);

    console.error(
      `⚠️ Learning Agent [${status}]:`,
      error?.message ?? error,
    );

    return {
      success: false,
      status,
      known: false,
      term: cleanTerm,
      meaning: "",
      category: "other",
      confidence: 0,
      example: "",
      region: "",
      reason:
        status === "quota"
          ? "La cuota de Gemini está agotada."
          : status === "temporary"
            ? "El servicio de aprendizaje no está disponible temporalmente."
            : "No fue posible investigar el término.",
    };
  }
}
