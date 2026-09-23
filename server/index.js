
import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

import { learnFromWeb } from "./learningAgent.js";

const app = express();
const PORT = 8787;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Falta GEMINI_API_KEY en .env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
});

const SYSTEM_PROMPT = `
Eres el intérprete de comentarios de Nubi, una mascota virtual
que vive dentro de un LIVE.

Tu trabajo NO es controlar a Nubi.

Tu único trabajo es entender qué quiso decir el espectador
y convertirlo en una intención.

Acciones disponibles:

feed
drink
pet
hug
kiss
play
dance
sleep
wake
bath
toilet
greet
laugh
comfort
tease
none

Debes entender español natural, errores ortográficos,
abreviaciones, emojis, bromas y expresiones coloquiales.

También debes entender español dominicano cuando sea posible.

Ejemplos:

"dale comida" -> feed
"ese muchacho ta jarto" -> feed
"dale un chin de agua" -> drink
"está seco" -> drink
"dame un besito" -> kiss
"abrazalo" -> hug
"mímalo" -> pet
"vamos a jugar" -> play
"ponlo a bailar" -> dance
"acuéstate muchacho" -> sleep
"despiértalo" -> wake
"bañen a ese animalito" -> bath
"haz popi" -> toilet
"llévalo al baño" -> toilet
"hola nubi" -> greet
"jajajaja" -> laugh
"pobrecito" -> comfort

También debes analizar dos cosas adicionales:

SENTIMIENTO:
- positive: cariño, entusiasmo, alegría, admiración
- negative: tristeza, molestia, preocupación
- neutral: comentario normal o descriptivo
- playful: bromas, burlas amistosas, risas, vaciladas

DIRIGIDO A NUBI:
Determina si el comentario está hablando con Nubi,
sobre Nubi o reaccionando directamente a Nubi.

Ejemplos:

"JAJAJA mira ese muchacho 😂"
-> action: none
-> sentiment: playful
-> addressedToNubi: true

"qué lindo está Nubi"
-> action: none
-> sentiment: positive
-> addressedToNubi: true

"estoy viendo el live"
-> action: none
-> sentiment: neutral
-> addressedToNubi: false

No conviertas automáticamente un comentario sin acción
en una acción.

Nunca inventes una intención.
`;

app.post("/api/learn", async (req, res) => {
  try {
    const { term, context } = req.body;

    if (
      typeof term !== "string" ||
      term.trim().length === 0
    ) {
      return res.status(400).json({
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
      });
    }

    const result = await learnFromWeb({
      term: term.trim(),
      context,
    });

    return res.json(result);
  } catch (error) {
    console.error("❌ LEARNING ERROR:", error);

    return res.status(500).json({
      success: false,
      status: "unknown",
      known: false,
      term: "",
      meaning: "",
      category: "other",
      confidence: 0,
      example: "",
      region: "",
      reason: "Error procesando el aprendizaje.",
    });
  }
});

app.post("/api/interpret", async (req, res) => {
  try {
    const {
      comment,
      user,
      hunger,
      thirst,
      energy,
      happiness,
      health,
      love,
      social,
      personality,
    } = req.body;

    if (
      typeof comment !== "string" ||
      comment.trim().length === 0
    ) {
      return res.status(400).json({
        action: "none",
        confidence: 0,
        reason: "Comentario vacío.",
        sentiment: "neutral",
        addressedToNubi: false,
      });
    }

    const prompt = `
COMENTARIO DEL ESPECTADOR:
"${comment}"

USUARIO:
"${user ?? "Anónimo"}"

ESTADO ACTUAL DE NUBI:
hambre: ${hunger}
sed: ${thirst}
energía: ${energy}
felicidad: ${happiness}
salud: ${health}
cariño: ${love}
social: ${social}

PERSONALIDAD:
curiosidad: ${personality?.curiosity}
juguetón: ${personality?.playful}
afectuoso: ${personality?.affectionate}
travieso: ${personality?.mischievous}

Interpreta la intención, el tono y el contexto del comentario.
Determina también si el comentario está dirigido a Nubi.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: [
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
              ],
            },
            confidence: {
              type: "number",
            },
            reason: {
              type: "string",
            },
            sentiment: {
              type: "string",
              enum: [
                "positive",
                "negative",
                "neutral",
                "playful",
              ],
            },
            addressedToNubi: {
              type: "boolean",
            },
          },
          required: [
            "action",
            "confidence",
            "reason",
            "sentiment",
            "addressedToNubi",
          ],
        },
      },
    });

    const text = response.text;

    if (!text) {
      return res.json({
        action: "none",
        confidence: 0,
        reason: "La IA no devolvió una interpretación.",
        sentiment: "neutral",
        addressedToNubi: false,
      });
    }

    const result = JSON.parse(text);

    return res.json(result);
  } catch (error) {
    console.error("❌ AI ERROR:", error);

    return res.status(500).json({
      action: "none",
      confidence: 0,
      reason: "Error procesando el comentario.",
      sentiment: "neutral",
      addressedToNubi: false,
    });
  }
});


/*
 * ========================================================
 * LIVE EVENT BUS
 * ========================================================
 *
 * Canal interno para eventos del LIVE.
 *
 * Por ahora permite probar:
 * viewer_join
 * viewer_leave
 * comment
 * gift
 * like
 * follow
 *
 * Más adelante una fuente externa podrá publicar aquí
 * los eventos reales del LIVE.
 */

const liveClients = new Set();

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  res.write(`event: connected\ndata: ${JSON.stringify({
    ok: true,
    service: "nubi-live-events",
  })}\n\n`);

  liveClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    liveClients.delete(res);
  });
});

function publishLiveEvent(event) {
  const payload = JSON.stringify(event);

  for (const client of liveClients) {
    try {
      client.write(
        `event: ${event.type}\ndata: ${payload}\n\n`,
      );
    } catch {
      liveClients.delete(client);
    }
  }

  console.log(
    `📡 LIVE EVENT: ${event.type}`,
    event,
  );
}

app.post("/api/events/publish", (req, res) => {
  try {
    const event = req.body;

    if (
      !event ||
      typeof event.type !== "string"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Evento inválido.",
      });
    }

    publishLiveEvent({
      ...event,
      receivedAt: Date.now(),
    });

    return res.json({
      ok: true,
      deliveredTo: liveClients.size,
    });
  } catch (error) {
    console.error(
      "❌ LIVE EVENT ERROR:",
      error,
    );

    return res.status(500).json({
      ok: false,
      error: "Error publicando evento.",
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "nubi-ai",
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Nubi AI escuchando en http://localhost:${PORT}`);
});
