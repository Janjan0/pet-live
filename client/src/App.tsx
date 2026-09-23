import { useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

import { interpretComment } from "./chat/interpreter";
import { processComment } from "./brain/nubiBrain";
import { interpretNubiIdentity } from "./brain/nubiIdentity";
import { advanceNubiLife } from "./brain/nubiLifeEngine";
import { chooseAutonomousDecision } from "./brain/nubiAutonomousMind";
import {
  createReturnMessage,
} from "./brain/nubiPresenceMemory";

import { createNubiSocialEvent } from "./brain/nubiSocialEvents";
import { type NubiState } from "./brain/nubiState";

import { interpretWithAI } from "./ai/interpreter";
import {
  rememberEpisode,
  type NubiEpisode,
} from "./nubi/memory/episodicMemory";
import {
  loadEpisodicMemory,
  saveEpisodicMemory,
} from "./nubi/memory/episodicStorage";
import { buildEpisode } from "./nubi/memory/episodeBuilder";
import {
  buildNubiSocialMemory,
} from "./brain/nubiSocialMemory";
import type { AIContext } from "./ai/types";

import {
  learnUnknownTerm,
  resolveAndLearnKnowledge,
} from "./nubi/knowledge/learningService";

import {
  loadKnowledgeBase,
  saveKnowledgeBase,
} from "./nubi/knowledge/knowledgeStorage";

import type {
  NubiKnowledge,
} from "./nubi/knowledge/types";

import type {
  NubiSemanticMemory,
} from "./nubi/semantic/types";

import {
  findSemanticMemory,
  rememberSemanticMemory,
  rememberPendingSemanticMemory,
  useSemanticMemory,
} from "./nubi/semantic/semanticMemory";

import {
  loadSemanticMemory,
  saveSemanticMemory,
} from "./nubi/semantic/semanticStorage";


import {
  registerViewerInteraction,
  registerViewerJoin,
  upsertViewerProfile,
} from "./viewer/viewerSystem";

import { processViewerGift } from "./economy/giftProcessor";
import { purchaseGift } from "./economy/purchase";
import { GIFT_CATALOG } from "./economy/gifts";
import {
  purchaseReturnGreeting,
  consumeReturnGreeting,
  getPendingReturnGreetings,
  RETURN_GREETING_PRICE,
} from "./economy/returnGreeting";
import type { GiftEvent } from "./economy/types";

import { addCommunityInteraction } from "./world/community";

import {
  recordPersonalityInteraction,
} from "./world/personalityHistory";

import {
  evolveNubiPersonality,
} from "./world/personalityEvolution";

import {
  getLevelFromExperience,
} from "./world/progression";

import {
  createInitialNubiWorld,
  type NubiWorld,
  type NubiSide,
} from "./world/nubiWorld";

import {
  loadViewerStorage,
  saveViewerStorage,
} from "./viewer/viewerStorage";

type EventType =
  | "like"
  | "follow"
  | "comment"
  | "food"
  | "toy"
  | "energy"
  | "special";

const stageNames = {
  egg: "Huevo",
  baby: "Bebé",
  child: "Niño",
  adult: "Adulto",
};

function getViewerIdentity(viewer: string) {
  const cleanUser =
    viewer.trim() || "Espectador";

  const viewerId =
    cleanUser
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) ||
    "espectador";

  return {
    viewerId,
    username: cleanUser,
    displayName: cleanUser,
  };
}

type NubiCommentContext = {
  text: string;
  viewerId: string;
  username: string;
  displayName: string;
};

function App() {
  const [world, setWorld] =
    useState<NubiWorld>(() => {
      const initialWorld =
        createInitialNubiWorld();

      const savedViewers =
        loadViewerStorage();

      return {
        ...initialWorld,
        viewers: {
          ...initialWorld.viewers,
          ...savedViewers,
        },
      };
    });

  const [activeSide, setActiveSide] =
    useState<NubiSide>("A");

  const [message, setMessage] = useState(
    "¡Hola! Soy Nubi 🐾",
  );

  const messageTimeoutRef = useRef<number | null>(null);

  const [lastEvent, setLastEvent] = useState(
    "Esperando al LIVE...",
  );

  const [comment, setComment] = useState("");
  const [thinking, setThinking] = useState(false);

  const [mood, setMood] = useState("normal");

  const [activeSocialEvent, setActiveSocialEvent] =
    useState<ReturnType<typeof createNubiSocialEvent> | null>(
      null,
    );

  const behaviorMemoryRef = useRef<{
    key: string | null;
    timestamp: number;
  }>({
    key: null,
    timestamp: 0,
  });

  const mentalStateRef = useRef<{
    desire: string | null;
    thought: string | null;
    intent: string | null;
    timestamp: number;
  }>({
    desire: null,
    thought: null,
    intent: null,
    timestamp: 0,
  });

  /*
   * Estado mundial más reciente.
   *
   * Los handlers asíncronos pueden conservar un "world"
   * antiguo del render en el que fueron creados.
   * Este ref permite consultar siempre el estado actual.
   */
  const worldRef = useRef(world);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  const [knowledgeBase, setKnowledgeBase] =
    useState<NubiKnowledge[]>(
      loadKnowledgeBase,
    );

  const [semanticMemories, setSemanticMemories] =
    useState<NubiSemanticMemory[]>(
      loadSemanticMemory,
    );

  const [episodicMemories, setEpisodicMemories] =
    useState<NubiEpisode[]>(
      loadEpisodicMemory,
    );

  const [viewer, setViewer] =
    useState("Espectador");

  const viewerIdentity =
    getViewerIdentity(viewer);

  const activePetId = world.sides[activeSide];
  const pet = world.pets[activePetId];

  /*
   * ========================================================
   * ENTRADA DEL ESPECTADOR AL LIVE
   * ========================================================
   *
   * Una sola lógica para:
   *
   * - selector manual de desarrollo
   * - eventos reales del LIVE
   *
   * La identidad SIEMPRE es viewerId.
   */
  const handleViewerJoin = useCallback(
    (event: {
      viewerId?: string;
      user?: string;
      username?: string;
      displayName?: string;
      timestamp?: number;
    }) => {
      const viewerId =
        event.viewerId?.trim();

      if (!viewerId) {
        return;
      }

      /*
       * En producción usamos la hora real de recepción.
       *
       * timestamp existe para poder simular eventos históricos
       * durante las pruebas locales.
       */
      const now =
        typeof event.timestamp === "number"
          ? event.timestamp
          : Date.now();

      const currentViewers =
        worldRef.current.viewers[activePetId] ?? [];

      const identity = {
        viewerId,
        username:
          event.username?.trim() ||
          event.user?.trim() ||
          viewerId,
        displayName:
          event.displayName?.trim() ||
          event.user?.trim() ||
          event.username?.trim() ||
          viewerId,
      };

      const joinResult =
        registerViewerJoin(
          currentViewers,
          identity,
          activePetId,
          now,
        );

      const {
        profile,
        isFirstLiveEntry,
        absenceDuration,
      } = joinResult;

      const returnedFromAbsence =
        !isFirstLiveEntry &&
        absenceDuration >=
          5 * 60 * 1000;

      /* diagnóstico temporal eliminado */

      /*
       * ----------------------------------------------------
       * PRIORIDAD DE SALUDOS
       * ----------------------------------------------------
       *
       * 1. Primera entrada
       * 2. Saludo personalizado después de ausencia
       * 3. Gran regalador después de ausencia
       * 4. Entrada normal: silencio
       */

      let greeting: string | null = null;
      let eventLabel: string | null = null;

      if (isFirstLiveEntry) {
        greeting =
          `👋 ¡Hola ${profile.displayName}! ` +
          `🐾 Nubi te reconoce por primera vez.`;

        eventLabel =
          `👋 @${profile.username} ` +
          `entró al LIVE por primera vez`;
      } else if (returnedFromAbsence) {
        const pendingGreeting =
          getPendingReturnGreetings(
            profile.viewerId,
          )[0] ?? null;

        if (pendingGreeting) {
          const consumedGreeting =
            consumeReturnGreeting(
              profile.viewerId,
              now,
            );

          if (consumedGreeting) {
            greeting =
              `🎁 ${consumedGreeting.message}`;

            eventLabel =
              `🎁 @${profile.username} ` +
              `regresó con saludo personalizado`;
          }
        }

        /*
         * 1000 monedas ganadas históricamente
         * = umbral inicial de gran regalador.
         *
         * La entrada sigue limitada por la ausencia
         * para evitar spam.
         */
        if (
          !greeting &&
          profile.totalCoinsEarned >= 1000
        ) {
          greeting =
            `👑 ¡${profile.displayName} volvió! ` +
            `Nubi sabe que eres uno de sus ` +
            `grandes apoyos. 💛`;

          eventLabel =
            `👑 @${profile.username} ` +
            `regresó · gran regalador`;
        }

        if (!greeting) {
          const absenceMinutes = Math.max(
            1,
            Math.round(
              absenceDuration / 60000,
            ),
          );

          greeting =
            `👋 ¡${profile.displayName}! ` +
            `Qué bueno verte otra vez. ` +
            `Nubi notó que estuviste ` +
            `${absenceMinutes} min fuera. 🐾`;

          eventLabel =
            `👋 @${profile.username} ` +
            `regresó al LIVE · ` +
            `${absenceMinutes} min fuera`;
        }
      }

      /*
       * Guardamos SIEMPRE la entrada.
       *
       * Entrar al LIVE no aumenta:
       * - interacciones
       * - cariño
       * - cuidado
       * - juego
       * - regalos
       *
       * Solo actualiza presencia.
       */
      setWorld((currentWorld) => {
        const viewers =
          currentWorld.viewers[activePetId] ?? [];

        const exists =
          viewers.some(
            (item) =>
              item.viewerId ===
              profile.viewerId,
          );

        return {
          ...currentWorld,
          viewers: {
            ...currentWorld.viewers,
            [activePetId]: exists
              ? viewers.map((item) =>
                  item.viewerId ===
                  profile.viewerId
                    ? profile
                    : item,
                )
              : [...viewers, profile],
          },
        };
      });

      if (greeting) {
        setMessage(greeting);
        setMood("affectionate");

        if (messageTimeoutRef.current !== null) {
          window.clearTimeout(
            messageTimeoutRef.current,
          );
        }

        messageTimeoutRef.current =
          window.setTimeout(() => {
            setMessage("");
            messageTimeoutRef.current = null;
          }, 4000);
      }

      if (eventLabel) {
        setLastEvent(eventLabel);
      }
    },
    [activePetId],
  );

  /*
   * LIVE EVENT BUS
   *
   * El servidor recibe los eventos externos y los entrega
   * aquí mediante SSE.
   */
  useEffect(() => {
    const source =
      new EventSource("/api/events");

    source.addEventListener(
      "connected",
      () => {
        /* conexión SSE establecida */
      },
    );

    source.addEventListener(
      "viewer_join",
      (event) => {
        try {
          const data =
            JSON.parse(event.data);

          handleViewerJoin({
            viewerId: data.viewerId,
            user: data.user,
            username: data.username,
            displayName: data.displayName,
            timestamp: data.timestamp,
          });
        } catch (error) {
          console.error(
            "❌ Error leyendo viewer_join:",
            error,
          );
        }
      },
    );

    source.onerror = () => {
      console.warn(
        "⚠️ Conexión con LIVE EVENT BUS perdida. " +
        "SSE intentará reconectar.",
      );
    };

    return () => {
      source.close();
    };
  }, [handleViewerJoin]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWorld((currentWorld) => {
        const currentPet =
          currentWorld.pets[activePetId];

        const nextPet =
          advanceNubiLife(currentPet);

        /*
         * El comportamiento se evalúa dentro del mismo
         * ciclo lógico, pero la memoria vive en un ref.
         *
         * Así cambiar el último comportamiento de Nubi
         * NO recrea el intervalo de vida.
         */
        const now = Date.now();
        const behaviorMemory =
          behaviorMemoryRef.current;

        const behaviorCooldown =
          3 * 60 * 1000;

        if (
          now - behaviorMemory.timestamp >=
          behaviorCooldown
        ) {
          /*
           * Nubi ya no solamente busca una necesidad.
           *
           * Su Autonomous Mind considera:
           * - necesidades
           * - personalidad
           * - felicidad
           * - energía
           * - cariño
           * - actividad reciente
           *
           * El resultado sigue siendo solamente una
           * INTENCIÓN. El Brain decide después si la acción
           * puede ejecutarse.
           */
          const recentChatActivity =
            nextPet.lastInteraction &&
            now -
              nextPet.lastInteraction.timestamp <
              5 * 60 * 1000
              ? 1
              : 0;

          const socialMemory =
            buildNubiSocialMemory(
              currentWorld.viewers[
                activePetId
              ] ?? [],
            );

          const decision =
            chooseAutonomousDecision(
              nextPet,
              recentChatActivity,
              episodicMemories,
              socialMemory,
            );

          if (decision) {
            mentalStateRef.current = {
              desire: decision.desire ?? null,
              thought: decision.thought ?? null,
              intent: decision.intent,
              timestamp: now,
            };

            /*
             * Las decisiones "idle" o de curiosidad no
             * necesitan ejecutar una acción.
             *
             * Las demás pasan por el Brain.
             */
            if (decision.action) {
              const interpretation = {
                action: decision.action,
                confidence: 1,
                response: "",
                sentiment:
                  decision.mood === "mischievous"
                    ? "playful"
                    : decision.mood === "affectionate"
                      ? "positive"
                      : "neutral",
                addressedToNubi: true,
              } as const;

              const brainResult =
                processComment(
                  nextPet,
                  interpretation,
                  "Nubi",
                  now,
                  "autonomous",
                );

              if (brainResult.accepted) {
                behaviorMemoryRef.current = {
                  key: decision.action,
                  timestamp: now,
                };

                const socialEvent =
                  createNubiSocialEvent(
                    decision.action,
                    decision.targetViewer,
                    now,
                  );

                if (socialEvent) {
                  setActiveSocialEvent(socialEvent);

                  window.setTimeout(() => {
                    setActiveSocialEvent((current) =>
                      current?.id === socialEvent.id
                        ? null
                        : current,
                    );
                  }, 6000);
                }

                /*
                 * MEMORIA EPISÓDICA — COMPORTAMIENTO AUTÓNOMO
                 *
                 * Esta experiencia no proviene de un espectador.
                 * Nubi decidió hacerla por sí misma.
                 */
                const episode = buildEpisode({
                  action: decision.action,
                  user: null,
                  targetViewer:
                    decision.targetViewer ?? null,
                  response:
                    brainResult.response ||
                    decision.response,
                  autonomous: true,
                });

                if (episode) {
                  const nextEpisodes =
                    rememberEpisode(
                      episodicMemories,
                      episode,
                    );

                  setEpisodicMemories(
                    nextEpisodes,
                  );

                  saveEpisodicMemory(
                    nextEpisodes,
                  );
                }

                const autonomousMessage =
                  socialEvent?.message ??
                  (brainResult.response ||
                    decision.response);

                setMessage(autonomousMessage);

                setMood(
                  brainResult.reaction?.mood ??
                    decision.mood,
                );

                setLastEvent(
                  decision.targetViewer
                    ? `🧠 Nubi decidió ${decision.intent} con ${decision.targetViewer}`
                    : `🧠 Nubi decidió: ${decision.intent}`,
                );

                return {
                  ...currentWorld,
                  pets: {
                    ...currentWorld.pets,
                    [activePetId]:
                      brainResult.state,
                  },
                };
              }
            }

            /*
             * Si la decisión no necesita una acción,
             * Nubi simplemente expresa lo que está haciendo.
             */
            if (!decision.action) {
              behaviorMemoryRef.current = {
                key: decision.intent,
                timestamp: now,
              };

              setMessage(decision.response);
              setMood(decision.mood);
              setLastEvent(
                `🧠 Nubi decidió: ${decision.intent}`,
              );
            }
          }
        }

        return {
          ...currentWorld,
          pets: {
            ...currentWorld.pets,
            [activePetId]: nextPet,
          },
        };
      });
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activePetId]);

  const activeViewers =
    world.viewers[activePetId];

  useEffect(() => {
    saveViewerStorage(world.viewers);
  }, [world.viewers]);

  function updateActivePet(
    updater: (pet: NubiState) => NubiState,
  ) {
    setWorld((currentWorld) => {
      const currentPet =
        currentWorld.pets[activePetId];

      const nextPet = updater(currentPet);

      return {
        ...currentWorld,

        pets: {
          ...currentWorld.pets,
          [activePetId]: nextPet,
        },
      };
    });
  }

  function applyEvent(type: EventType) {
    updateActivePet((current) => {
      const next = { ...current };

      switch (type) {
        case "like":
          next.happiness = Math.min(
            100,
            next.happiness + 1,
          );
          next.social += 1;
          next.experience += 1;
          setMessage(
            "¡Nubi siente el cariño del LIVE! ❤️",
          );
          setLastEvent("❤️ Like recibido");
          break;

        case "follow":
          next.happiness = Math.min(
            100,
            next.happiness + 5,
          );
          next.social += 5;
          next.experience += 3;
          setMessage(
            "¡Tenemos un nuevo amigo! 👤",
          );
          setLastEvent("👤 Nuevo follower");
          break;

        case "comment":
          next.social += 2;
          next.experience += 2;
          setMessage(
            "¡Nubi está leyendo el chat! 💬",
          );
          setLastEvent(
            "💬 Comentario recibido",
          );
          break;

        case "food":
          next.hunger = Math.min(
            100,
            next.hunger + 15,
          );
          next.health = Math.min(
            100,
            next.health + 2,
          );
          next.experience += 5;
          setMessage(
            "¡Ñam! Nubi recibió comida 🍎",
          );
          setLastEvent(
            "🍎 Regalo de comida",
          );
          break;

        case "toy":
          next.happiness = Math.min(
            100,
            next.happiness + 12,
          );
          next.energy = Math.max(
            0,
            next.energy - 3,
          );
          next.love = Math.min(
            100,
            next.love + 5,
          );
          next.experience += 8;
          setMessage(
            "¡Nubi recibió un juguete! 🧸",
          );
          setLastEvent(
            "🧸 Regalo de juguete",
          );
          break;

        case "energy":
          next.energy = Math.min(
            100,
            next.energy + 20,
          );
          next.experience += 10;
          setMessage(
            "¡Nubi está cargadísimo! ⚡",
          );
          setLastEvent(
            "⚡ Regalo de energía",
          );
          break;

        case "special":
          next.happiness = Math.min(
            100,
            next.happiness + 20,
          );
          next.energy = Math.min(
            100,
            next.energy + 15,
          );
          next.love = Math.min(
            100,
            next.love + 15,
          );
          next.experience += 25;
          setMessage(
            "✨ ¡NUBI RECIBIÓ UN REGALO ESPECIAL! ✨",
          );
          setLastEvent(
            "💎 Regalo especial",
          );
          break;
      }

      return next;
    });
  }

  async function sendComment(
    context?: NubiCommentContext,
  ) {
    const text =
      context?.text.trim() ??
      comment.trim();

    const commentViewer =
      context?.displayName ??
      viewer;

    const commentViewerIdentity =
      context
        ? {
            viewerId: context.viewerId,
            username: context.username,
            displayName: context.displayName,
          }
        : viewerIdentity;

    if (!text || thinking) return;

    setComment("");

    /*
     * ========================================================
     * MODO DEBUG DE NUBI
     * ========================================================
     *
     * Estos comandos solo sirven durante el desarrollo.
     * No pasan por conocimiento ni Gemini.
     *
     * El comando modifica el estado y deja que los mismos
     * sistemas reales de Nubi reaccionen después.
     */
    const debugCommand =
      text.toLowerCase();

    if (
      debugCommand.startsWith("/debug")
    ) {
      const mode =
        debugCommand
          .replace(/^\/debug\s*/, "")
          .trim();

      updateActivePet((current) => {
        const next = { ...current };

        switch (mode) {
          case "hambre":
            next.hunger = 10;
            next.illness = "healthy";
            break;

          case "sed":
            next.thirst = 10;
            next.illness = "healthy";
            break;

          case "sueño":
          case "sueno":
            next.energy = 10;
            next.illness = "healthy";
            break;

          case "sucio":
            next.hygiene = 10;
            next.illness = "healthy";
            break;

          case "baño":
          case "bano":
            next.bathroom = 95;
            next.illness = "healthy";
            break;

          case "enfermo":
            next.health = 40;
            next.illness = "sick";
            break;

          case "reset":
            next.hunger = 72;
            next.thirst = 68;
            next.energy = 68;
            next.happiness = 78;
            next.health = 94;
            next.hygiene = 100;
            next.bathroom = 0;
            next.illness = "healthy";
            break;

          default:
            return current;
        }

        next.lastLifeUpdate =
          Date.now();

        return next;
      });

      /*
       * Permitimos que el próximo ciclo del Behavior Engine
       * reaccione inmediatamente, sin esperar los 3 minutos.
       */
      behaviorMemoryRef.current = {
        key: null,
        timestamp: 0,
      };

      const validModes = [
        "hambre",
        "sed",
        "sueño",
        "sueno",
        "sucio",
        "baño",
        "bano",
        "enfermo",
        "reset",
        "regreso",
      ];

      if (validModes.includes(mode)) {
        setLastEvent(
          `🧪 Debug: ${mode}`,
        );

        setMessage(
          mode === "reset"
            ? "Nubi volvió a la normalidad 🐾"
            : "🧪 Estado de Nubi preparado...",
        );

        setMood(
          mode === "reset"
            ? "normal"
            : "curious",
        );
      } else {
        setMessage(
          "Comando debug desconocido 🤔",
        );

        setLastEvent(
          "🧪 Debug desconocido",
        );
      }

      if (mode === "regreso") {
        const now = Date.now();
        const absenceStart =
          now - 6 * 60 * 1000;

        setWorld((currentWorld) => {
          const currentViewers =
            currentWorld.viewers[activePetId] ?? [];

          const nextViewers =
            currentViewers.map((profile) =>
              profile.viewerId === commentViewerIdentity.viewerId
                ? {
                    ...profile,
                    lastSeen: absenceStart,
                  }
                : profile,
            );

          return {
            ...currentWorld,
            viewers: {
              ...currentWorld.viewers,
              [activePetId]: nextViewers,
            },
          };
        });

        setMessage(
          "🧪 Ausencia simulada: 6 minutos. Ahora puedes regresar.",
        );

        setLastEvent(
          `🧪 Debug regreso preparado para @${commentViewerIdentity.viewerId}`,
        );

        setMood("curious");
        return;
      }

      return;
    }

    const localInterpretation =
      interpretComment(
        text,
      );

    setLastEvent("🧬 Evolución de Nubi");

    /*
     * ========================================================
     * IDENTIDAD DE NUBI
     * ========================================================
     *
     * La identidad propia de Nubi tiene prioridad absoluta
     * sobre el Knowledge Agent y Gemini.
     *
     * Nubi no necesita aprender quién es.
     * Ya sabe quién es.
     *
     * También puede consultar su propio estado para responder
     * preguntas dinámicas como su edad o personalidad.
     */
    const identityAnswer =
      interpretNubiIdentity(
        text,
        pet,
      );

    if (identityAnswer) {
      setMessage(
        identityAnswer.response,
      );

      setMood(
        identityAnswer.question === "personality"
          ? "affectionate"
          : "curious",
      );

      setLastEvent(
        `🐾 Identidad: ${identityAnswer.question}`,
      );

      return;
    }

    /*
     * Nubi primero intenta resolver preguntas
     * de conocimiento mediante su propia memoria.
     *
     * Si no conoce el término, el Learning Agent
     * puede investigarlo y enseñárselo.
     */
    const knowledgeResult =
      await resolveAndLearnKnowledge(
        knowledgeBase,
        text,
        commentViewer,
      );

    /*
     * ESTADO 1:
     * Nubi ya conoce la respuesta.
     *
     * No usamos Gemini ni el intérprete general.
     * La respuesta sale directamente de su memoria.
     */
    if (
      knowledgeResult.status === "known" &&
      knowledgeResult.knowledge
    ) {
      setMessage(
        `💡 ${knowledgeResult.knowledge.meaning}`,
      );

      setMood("curious");
      setLastEvent(
        `🧠 Nubi recordó: ${knowledgeResult.term}`,
      );

      return;
    }

    /*
     * ESTADO 2:
     * Nubi acaba de aprender algo nuevo.
     *
     * Guardamos inmediatamente la nueva memoria.
     */
    if (
      knowledgeResult.status === "learned" &&
      knowledgeResult.knowledge
    ) {
      const nextKnowledgeBase =
        knowledgeResult.knowledgeBase;

      setKnowledgeBase(
        nextKnowledgeBase,
      );

      saveKnowledgeBase(
        nextKnowledgeBase,
      );

      setMessage(
        `🧠 ¡Nubi aprendió algo nuevo! ${knowledgeResult.knowledge.meaning}`,
      );

      setMood("curious");
      setLastEvent(
        `📚 Nubi aprendió: ${knowledgeResult.term}`,
      );

      return;
    }

    /*
     * ESTADOS 3 y 4:
     *
     * La pregunta sí fue entendida, pero Nubi todavía
     * no puede responderla.
     *
     * No debemos mandar estos casos al intérprete general,
     * porque eso terminaría mostrando:
     * "Nubi no entendió eso 🤔"
     *
     * Nubi entendió perfectamente la pregunta.
     */
    const knowledgeQuestionFailed =
      knowledgeResult.resolution.question.isQuestion &&
      (
        knowledgeResult.status === "quota" ||
        knowledgeResult.status === "temporary" ||
        knowledgeResult.status === "failed" ||
        knowledgeResult.status === "not-found" ||
        knowledgeResult.status === "not-confident"
      );

    if (knowledgeQuestionFailed) {
      const term =
        knowledgeResult.term ||
        knowledgeResult.resolution.question.term;

      if (
        knowledgeResult.status === "quota"
      ) {
        console.log(
          "🟡 Learning Agent sin cuota.",
        );

        setMessage(
          `Mmm... todavía no sé qué significa "${term}" 🥺. Intentaré aprenderlo cuando pueda 🧠🐾`,
        );
        setLastEvent(
          `🧠 Nubi quiere aprender: ${term}`,
        );
      } else if (
        knowledgeResult.status === "temporary"
      ) {
        console.log(
          "🟠 Learning Agent temporalmente no disponible.",
        );

        setMessage(
          `Sé que me estás preguntando qué significa "${term}", pero ahora mismo no puedo investigarlo 🥺`,
        );
        setLastEvent(
          `⏳ Nubi no pudo investigar: ${term}`,
        );
      } else if (
        knowledgeResult.status === "not-confident"
      ) {
        setMessage(
          `Todavía no estoy seguro de qué significa "${term}" 🤔`,
        );
        setLastEvent(
          `❓ Nubi no está seguro: ${term}`,
        );
      } else {
        setMessage(
          `Todavía no sé qué significa "${term}" 🤔`,
        );
        setLastEvent(
          `📖 Nubi no conoce: ${term}`,
        );
      }

      setMood("curious");
      return;
    }

    /*
     * Solo los comentarios que NO son preguntas de
     * conocimiento continúan hacia el intérprete normal.
     *
     * Aquí es donde puede ocurrir el verdadero:
     * "Nubi no entendió eso 🤔"
     */
    let interpretation = localInterpretation;

    /*
     * ==========================================================
     * INTELIGENCIA SOCIAL
     * ==========================================================
     *
     * Las preguntas sobre ausencia/regreso no pasan por Gemini.
     * Nubi usa la memoria real del espectador para responder.
     */

    if (localInterpretation.socialIntent) {
      const socialIntent =
        localInterpretation.socialIntent;

      const previousViewers =
        world.viewers[activePetId] ?? [];

      const previousViewer =
        previousViewers.find(
          (profile) =>
            profile.viewerId === commentViewerIdentity.viewerId,
        );

      const now = Date.now();

      const absenceDuration =
        previousViewer
          ? Math.max(
              0,
              now - previousViewer.lastSeen,
            )
          : 0;

      const wasAbsent =
        previousViewer &&
        absenceDuration >=
          5 * 60 * 1000;

      let socialResponse = "";

      const pendingReturnGreeting =
        wasAbsent
          ? getPendingReturnGreetings(
              commentViewerIdentity.viewerId,
            )[0] ?? null
          : null;

      const purchasedReturnGreeting =
        pendingReturnGreeting && wasAbsent
          ? consumeReturnGreeting(
              commentViewerIdentity.viewerId,
              now,
            )
          : null;

      if (socialIntent === "returned") {
        if (purchasedReturnGreeting) {
          socialResponse =
            `🎁 ${purchasedReturnGreeting.message}`;
        } else if (wasAbsent) {
          socialResponse =
            createReturnMessage(
              {
                viewerId:
                  previousViewer.viewerId,
                user: previousViewer.user,
                familiarity:
                  previousViewer.bond >= 80
                    ? "close"
                    : previousViewer.bond >= 60
                      ? "trusted"
                      : previousViewer.bond >= 35
                        ? "familiar"
                        : previousViewer.totalInteractions >= 2
                          ? "known"
                          : "stranger",
                bond: previousViewer.bond,
                role: "companion",
                pattern: "",
                actionUsage:
                  previousViewer.actionUsage,
                totalInteractions:
                  previousViewer.totalInteractions,
                affection:
                  previousViewer.affection,
                care:
                  previousViewer.care,
                play:
                  previousViewer.play,
                gifts:
                  previousViewer.gifts,
                favoriteAction:
                  previousViewer.favoriteAction,
                lastSeen:
                  previousViewer.lastSeen,
              },
              absenceDuration,
            );
        } else if (previousViewer) {
          socialResponse =
            previousViewer.bond >= 60
              ? `🥰 ¡${commentViewer}! Qué bueno verte otra vez.`
              : `🐾 ¡${commentViewer}! Nubi te reconoce.`;
        } else {
          socialResponse =
            `🐾 ¡Hola, ${commentViewer}! Nubi te está conociendo.`;
        }
      } else if (
        socialIntent === "missing_me"
      ) {
        if (wasAbsent) {
          if (previousViewer.bond >= 80) {
            socialResponse =
              `🥹 Claro que sí, ${commentViewer}. Nubi notó que te fuiste.`;
          } else if (
            previousViewer.bond >= 60
          ) {
            socialResponse =
              `💕 Sí, ${commentViewer}. Nubi notó tu ausencia.`;
          } else if (
            previousViewer.bond >= 35
          ) {
            socialResponse =
              `🐾 Nubi sí notó que no estabas, ${commentViewer}.`;
          } else {
            socialResponse =
              `👀 Nubi notó que estuviste un rato fuera, ${commentViewer}.`;
          }
        } else if (previousViewer) {
          socialResponse =
            `🥰 Si acabas de estar aquí, Nubi no tuvo tiempo de extrañarte.`;
        } else {
          socialResponse =
            `🐾 Nubi todavía está conociéndote, ${commentViewer}.`;
        }
      } else if (
        socialIntent === "noticed_absence"
      ) {
        if (wasAbsent) {
          socialResponse =
            `👀 Sí, ${commentViewer}. Nubi notó que te fuiste.`;
        } else if (previousViewer) {
          socialResponse =
            `🐾 Nubi te tenía aquí hace poquito, ${commentViewer}.`;
        } else {
          socialResponse =
            `🐾 Nubi todavía está aprendiendo quién eres, ${commentViewer}.`;
        }
      }

      setMessage(socialResponse);
      setMood(
        socialIntent === "missing_me"
          ? "affectionate"
          : socialIntent === "returned"
            ? "affectionate"
            : "curious",
      );

      setLastEvent(
        socialIntent === "returned"
          ? wasAbsent
            ? `🥹 ${commentViewer} regresó`
            : `🐾 ${commentViewer} anunció que está de vuelta`
          : socialIntent === "missing_me"
            ? `💕 ${commentViewer} preguntó si Nubi lo extrañó`
            : `👀 ${commentViewer} preguntó si Nubi notó su ausencia`,
      );

      /*
       * La pregunta/declaración cuenta como presencia actual,
       * pero NO altera las estadísticas de una acción física.
       *
       * Solo actualizamos lastSeen.
       */
      setWorld((currentWorld) => {
        const currentViewers =
          currentWorld.viewers[activePetId] ?? [];

        const nextViewers =
          previousViewer
            ? currentViewers.map((profile) =>
                profile.viewerId ===
                previousViewer.viewerId
                  ? {
                      ...profile,
                      lastSeen: now,
                      totalInteractions:
                        profile.totalInteractions + 1,
                    }
                  : profile,
              )
            : currentViewers;

        return {
          ...currentWorld,
          viewers: {
            ...currentWorld.viewers,
            [activePetId]:
              nextViewers,
          },
        };
      });

      setThinking(false);
      return;
    }

    /*
     * MEMORIA SEMÁNTICA
     *
     * Nubi puede aprender expresiones que no están
     * escritas explícitamente en el intérprete.
     *
     * Ejemplo:
     *
     *   "te quiero ver brillar"
     *          ↓
     *      "ver brillar"
     *          ↓
     *   memoria semántica
     *          ↓
     *   Gemini si no existe
     *          ↓
     *   significado + acción
     *
     * Gemini nunca ejecuta directamente la acción.
     * Solo propone una capacidad que Nubi ya conoce.
     */

    if (
      localInterpretation.action === "none" &&
      localInterpretation.unknownConstructionTerm
    ) {
      const unknownTerm =
        localInterpretation.unknownConstructionTerm;

      /*
       * Primero buscamos si Nubi ya aprendió esta expresión.
       */
      const semanticResult =
        findSemanticMemory(
          semanticMemories,
          unknownTerm,
        );

      if (
        semanticResult.found &&
        semanticResult.memory
      ) {
        const memory =
          semanticResult.memory;

        /*
         * Actualizamos estadísticas de uso.
         */
        const usedMemory =
          useSemanticMemory(memory);

        const nextSemanticMemories =
          semanticMemories.map(
            (item) =>
              item.id === usedMemory.id
                ? usedMemory
                : item,
          );

        setSemanticMemories(
          nextSemanticMemories,
        );

        saveSemanticMemory(
          nextSemanticMemories,
        );

        /*
         * Si la expresión tiene una acción válida,
         * la convertimos en una interpretación normal.
         *
         * A partir de aquí Nubi seguirá exactamente
         * el mismo flujo que cualquier otra acción.
         */
        if (
          memory.action &&
          memory.action !== "none"
        ) {
          interpretation = {
            action: memory.action,
            confidence: memory.confidence,
            response: "",
            sentiment: "positive",
            addressedToNubi: true,
          };

          setLastEvent(
            `🧠 Nubi recordó: "${memory.expression}" → ${memory.action}`,
          );
        } else {
          /*
           * Nubi puede conocer el significado de algo
           * aunque todavía no sepa convertirlo en una
           * acción que pueda ejecutar.
           */
          setMessage(
            `🧠 Nubi recuerda que "${memory.expression}" significa ${memory.meaning}`,
          );

          setLastEvent(
            `🧠 Memoria semántica: ${memory.expression}`,
          );

          setMood("curious");
          return;
        }
      } else {
        /*
         * La expresión es nueva.
         * Gemini intenta enseñarle el significado y,
         * si corresponde, una acción existente.
         */
        setThinking(true);
        setMessage(
          `Nubi está intentando entender "${unknownTerm}"... 🧠🐾`,
        );
        setMood("curious");

        try {
          const learningResult =
            await learnUnknownTerm(
              knowledgeBase,
              unknownTerm,
              text,
              commentViewer,
            );

          /*
           * Si Gemini encontró una definición pero no
           * pudo asociarla a una capacidad real,
           * igualmente podemos conservar el significado.
           */
          if (
            learningResult.status === "learned" &&
            learningResult.knowledge
          ) {
            const nextKnowledgeBase =
              learningResult.knowledgeBase;

            setKnowledgeBase(
              nextKnowledgeBase,
            );

            saveKnowledgeBase(
              nextKnowledgeBase,
            );

            const webResult =
              learningResult.webResult;

            const suggestedAction =
              webResult?.suggestedAction ??
              "none";

            const nextSemanticMemories =
              rememberSemanticMemory(
                semanticMemories,
                unknownTerm,
                learningResult.knowledge.meaning,
                suggestedAction,
                commentViewer,
                webResult?.confidence ??
                  learningResult.knowledge.confidence,
              );

            setSemanticMemories(
              nextSemanticMemories,
            );

            saveSemanticMemory(
              nextSemanticMemories,
            );

            /*
             * Si aprendió una acción existente,
             * NO terminamos aquí.
             *
             * Dejamos que processComment() ejecute
             * realmente la acción.
             */
            if (
              suggestedAction !== "none"
            ) {
              interpretation = {
                action: suggestedAction,
                confidence:
                  webResult?.confidence ??
                  learningResult.knowledge.confidence,
                response: "",
                sentiment:
                  webResult?.suggestedAction
                    ? "positive"
                    : "neutral",
                addressedToNubi: true,
              };

              setLastEvent(
                `🧠 Nubi aprendió: "${unknownTerm}" → ${suggestedAction}`,
              );

              setThinking(false);
            } else {
              /*
               * Aprendió el significado, pero todavía
               * no existe una acción de Nubi asociada.
               */
              setMessage(
                `🧠 Nubi aprendió algo nuevo: ${learningResult.knowledge.meaning}`,
              );

              setLastEvent(
                `📚 Nubi aprendió: ${unknownTerm}`,
              );

              setMood("curious");
              setThinking(false);
              return;
            }
          } else if (
            learningResult.status === "already-known" &&
            learningResult.knowledge
          ) {
            /*
             * El conocimiento factual ya existía.
             *
             * Si el Learning Agent también entregó una
             * acción semántica, aprovechamos esa información.
             */
            const webResult =
              learningResult.webResult;

            const suggestedAction =
              webResult?.suggestedAction ??
              "none";

            if (
              suggestedAction !== "none"
            ) {
              const nextSemanticMemories =
                rememberSemanticMemory(
                  semanticMemories,
                  unknownTerm,
                  learningResult.knowledge.meaning,
                  suggestedAction,
                  commentViewer,
                  webResult?.confidence ??
                    learningResult.knowledge.confidence,
                );

              setSemanticMemories(
                nextSemanticMemories,
              );

              saveSemanticMemory(
                nextSemanticMemories,
              );

              interpretation = {
                action: suggestedAction,
                confidence:
                  webResult?.confidence ??
                  learningResult.knowledge.confidence,
                response: "",
                sentiment: "positive",
                addressedToNubi: true,
              };

              setLastEvent(
                `🧠 Nubi recordó: "${unknownTerm}" → ${suggestedAction}`,
              );

              setThinking(false);
            } else {
              setMessage(
                `¡Ahhh! Nubi recuerda qué significa "${learningResult.term}" 🧠🐾`,
              );

              setLastEvent(
                `🧠 Nubi recordó: ${learningResult.term}`,
              );

              setMood("curious");
              setThinking(false);
              return;
            }
          } else if (
            learningResult.status === "known" &&
            learningResult.knowledge
          ) {
            setMessage(
              "Nubi ya sabía eso 🧠🐾",
            );

            setLastEvent(
              `🧠 Nubi recordó: ${learningResult.term}`,
            );

            setMood("curious");
            setThinking(false);
            return;
          } else {
            /*
             * Gemini no pudo enseñar esta expresión.
             *
             * No inventamos significado ni acción.
             * La guardamos como memoria PENDIENTE para
             * que Nubi recuerde que esta expresión existe
             * y pueda aprenderla más adelante.
             */
            const nextSemanticMemories =
              rememberPendingSemanticMemory(
                semanticMemories,
                unknownTerm,
                commentViewer,
              );

            setSemanticMemories(
              nextSemanticMemories,
            );

            saveSemanticMemory(
              nextSemanticMemories,
            );

            const pendingStatus =
              learningResult.status;

            if (pendingStatus === "quota") {
              setMessage(
                `🧠 Nubi todavía no sabe qué significa "${unknownTerm}"... pero lo voy a recordar 🐾`,
              );
            } else if (
              pendingStatus === "temporary"
            ) {
              setMessage(
                `🧠 Nubi quiere aprender "${unknownTerm}", pero ahora mismo no puede investigar eso 🐾`,
              );
            } else {
              setMessage(
                `🧠 Nubi todavía no entiende "${unknownTerm}"... pero lo recordaré 🐾`,
              );
            }

            setLastEvent(
              `🧠 Expresión pendiente: ${unknownTerm}`,
            );

            setMood("curious");
            setThinking(false);
            return;
          }
        } catch (error) {
          console.error(
            "❌ Error aprendiendo construcción semántica:",
            error,
          );

          /*
           * Incluso si el servicio falla por completo,
           * Nubi conserva la expresión como pendiente.
           *
           * Importante:
           * NO inventamos significado ni acción.
           */
          const nextSemanticMemories =
            rememberPendingSemanticMemory(
              semanticMemories,
              unknownTerm,
              commentViewer,
            );

          setSemanticMemories(
            nextSemanticMemories,
          );

          saveSemanticMemory(
            nextSemanticMemories,
          );

          setMessage(
            `🧠 Nubi todavía no entiende "${unknownTerm}"... pero lo recordaré 🐾`,
          );

          setLastEvent(
            `🧠 Expresión pendiente: ${unknownTerm}`,
          );

          setMood("curious");
          setThinking(false);
          return;
        }
      }
    }

    if (localInterpretation.action === "none") {
      setThinking(true);
      setMessage(
        "Nubi está pensando... 🧠🐾",
      );

      try {
        const context: AIContext = {
          petId: pet.id,
          petName: pet.name,
          comment: text,
          user: commentViewer,
          hunger: pet.hunger,
          thirst: pet.thirst,
          energy: pet.energy,
          happiness: pet.happiness,
          health: pet.health,
          love: pet.love,
          social: pet.social,
          personality: {
            curiosity:
              pet.personality.curiosity,
            playful:
              pet.personality.playful,
            affectionate:
              pet.personality.affectionate,
            mischievous:
              pet.personality.mischievous,
          },
        };

        const aiInterpretation =
          await interpretWithAI(context);

        console.log(
          "🧠 NUBI AI:",
          aiInterpretation,
        );

        if (
          aiInterpretation.confidence >= 0.7
        ) {
          interpretation = {
            action: aiInterpretation.action,
            confidence:
              aiInterpretation.confidence,
            response: "",
            sentiment:
              aiInterpretation.sentiment,
            addressedToNubi:
              aiInterpretation.addressedToNubi,
          };
        }
      } catch (error) {
        console.error(
          "❌ Error con Nubi AI:",
          error,
        );
      } finally {
        setThinking(false);
      }
    }

    updateActivePet((current) => {
      const now = Date.now();

      /*
       * REGRESO DEL ESPECTADOR
       *
       * Miramos el lastSeen anterior, antes de
       * registrar la interacción actual.
       *
       * Un espectador nuevo no cuenta como regreso.
       * Una ausencia de 5+ minutos sí.
       */
      const previousViewers =
        worldRef.current.viewers[activePetId] ?? [];

      const previousViewer =
        previousViewers.find(
          (profile) =>
            profile.viewerId === commentViewerIdentity.viewerId,
        );

      const returnedFromAbsence =
        previousViewer &&
        now - previousViewer.lastSeen >=
          5 * 60 * 1000;

      /*
       * El saludo comprado NO se consume todavía.
       *
       * Primero dejamos que Nubi procese el comentario.
       * Si la acción es aceptada, entonces consumimos
       * exactamente un saludo.
       *
       * Así un comentario rechazado no gasta el saludo.
       */
      const hasPendingReturnGreeting =
        returnedFromAbsence;

      const returnMessage =
        returnedFromAbsence
          ? createReturnMessage(
              {
                viewerId:
                  previousViewer.viewerId,
                user: previousViewer.user,
                familiarity:
                  previousViewer.bond >= 80
                    ? "close"
                    : previousViewer.bond >= 60
                      ? "trusted"
                      : previousViewer.bond >= 35
                        ? "familiar"
                        : previousViewer.totalInteractions >= 2
                          ? "known"
                          : "stranger",
                bond: previousViewer.bond,
                role: "companion",
                pattern: "",
                actionUsage:
                  previousViewer.actionUsage,
                totalInteractions:
                  previousViewer.totalInteractions,
                affection:
                  previousViewer.affection,
                care:
                  previousViewer.care,
                play:
                  previousViewer.play,
                gifts:
                  previousViewer.gifts,
                favoriteAction:
                  previousViewer.favoriteAction,
                lastSeen:
                  previousViewer.lastSeen,
              },
              now - previousViewer.lastSeen,
            )
          : null;

      const debugReturnInfo =
        `🧪 Regreso: ${returnedFromAbsence ? "SÍ" : "NO"} · ` +
        `Perfil: ${previousViewer ? "SÍ" : "NO"} · ` +
        `Ausencia: ${previousViewer ? Math.round((now - previousViewer.lastSeen) / 60000) : 0} min · ` +
        `viewerId: ${commentViewerIdentity.viewerId}`;

      const result = processComment(
        current,
        interpretation,
        commentViewer,
      );

      if (result.accepted) {
        const purchasedReturnGreeting =
          hasPendingReturnGreeting
            ? consumeReturnGreeting(
                commentViewerIdentity.viewerId,
                now,
              )
            : null;

        const finalReturnMessage =
          purchasedReturnGreeting
            ? `🎁 ${purchasedReturnGreeting.message}`
            : returnMessage;

        setMessage(
          finalReturnMessage
            ? `${finalReturnMessage} ${result.response}`
            : result.response,
        );

        setMood(
          returnedFromAbsence
            ? "affectionate"
            : result.reaction?.mood ?? "normal",
        );

        if (returnedFromAbsence) {
          setLastEvent(
            `${debugReturnInfo} · 🥹 ${commentViewer} volvió al LIVE`,
          );
        } else {
          setLastEvent(debugReturnInfo);
        }

        setWorld((currentWorld) => {
          const currentViewers =
            currentWorld.viewers[activePetId] ?? [];

          const viewerResult =
            registerViewerInteraction(
              currentViewers,
              commentViewerIdentity,
              activePetId,
              result.action,
            );

          /*
           * MEMORIA EPISÓDICA
           *
           * Primero actualizamos la relación con
           * el espectador y después guardamos la
           * experiencia de Nubi.
           *
           * Así el episodio puede incorporar el
           * contexto social actualizado.
           */
          const episode = buildEpisode({
            action: result.action,
            user: commentViewer,
            response: result.response,
            autonomous: false,
            viewerProfile:
              viewerResult.profile,
          });

          if (episode) {
            const nextEpisodes =
              rememberEpisode(
                episodicMemories,
                episode,
              );

            setEpisodicMemories(
              nextEpisodes,
            );

            saveEpisodicMemory(
              nextEpisodes,
            );
          }

          const affectionActions = [
            "pet",
            "hug",
            "kiss",
            "comfort",
          ];

          const careActions = [
            "feed",
            "drink",
            "bath",
            "toilet",
            "sleep",
          ];

          const playActions = [
            "play",
            "dance",
            "tease",
          ];

          const affection =
            affectionActions.includes(
              result.action,
            )
              ? 1
              : 0;

          const care =
            careActions.includes(
              result.action,
            )
              ? 1
              : 0;

          const play =
            playActions.includes(
              result.action,
            )
              ? 1
              : 0;

          const currentCommunity =
            currentWorld.communities[
              activePetId
            ];

          const nextCommunity =
            addCommunityInteraction(
              currentCommunity,
              commentViewer,
              affection,
              care,
              play,
            );

          const currentPet =
            currentWorld.pets[activePetId];

          const nextPersonalityHistory =
            recordPersonalityInteraction(
              currentPet.personalityHistory,
              result.action,
            );

          const petWithHistory: NubiState = {
            ...currentPet,
            personalityHistory:
              nextPersonalityHistory,
          };

          const shouldEvolvePersonality =
            nextPersonalityHistory.totalInteractions > 0 &&
            nextPersonalityHistory.totalInteractions % 10 === 0;

          const personalityEvolution =
            shouldEvolvePersonality
              ? evolveNubiPersonality(
                  petWithHistory,
                  nextCommunity,
                )
              : {
                  pet: petWithHistory,
                  changed: false,
                };

          return {
            ...currentWorld,

            viewers: {
              ...currentWorld.viewers,

              [activePetId]:
                upsertViewerProfile(
                  currentViewers,
                  viewerResult,
                ),
            },

            communities: {
              ...currentWorld.communities,

              [activePetId]:
                nextCommunity,
            },

            pets: {
              ...currentWorld.pets,

              [activePetId]:
                personalityEvolution.pet,
            },
          };
        })
      } else if (result.reason !== "unknown") {
        setMessage(result.response);
        setMood(
          result.reaction?.mood ?? "normal",
        );
      } else {
        setMessage(
          "Nubi no entendió eso 🤔",
        );
        setMood("curious");
      }

      return result.state;
    });
  }

  function handleCommentKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      void sendComment();
    }
  }

  const currentLevel =
    getLevelFromExperience(
      pet.experience,
    );

  const stageRequirements: Record<
    NubiState["stage"],
    number
  > = {
    egg: 0,
    baby: 300,
    child: 1200,
    adult: 4000,
  };

  const currentStageXp =
    stageRequirements[pet.stage];

  const stageOrder: NubiState["stage"][] = [
    "egg",
    "baby",
    "child",
    "adult",
  ];

  const currentStageIndex =
    stageOrder.indexOf(pet.stage);

  const nextStage =
    stageOrder[
      Math.min(
        stageOrder.length - 1,
        currentStageIndex + 1,
      )
    ];

  const nextStageXp =
    stageRequirements[nextStage];

  const stageRange =
    nextStageXp - currentStageXp;

  const stageProgress =
    nextStage === pet.stage
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            ((pet.experience - currentStageXp) /
              stageRange) *
              100,
          ),
        );

  const canEvolve =
    pet.stage !== "adult" &&
    pet.experience >= nextStageXp;

  function evolve() {
    if (!canEvolve) return;

    updateActivePet((current) => {
      const stages: NubiState["stage"][] = [
        "egg",
        "baby",
        "child",
        "adult",
      ];

      const index = stages.indexOf(
        current.stage,
      );

      const nextStage =
        stages[
          Math.min(
            stages.length - 1,
            index + 1,
          )
        ];

      return {
        ...current,
        stage: nextStage,
        experience: current.experience,
      };
    });

    setMessage(
      "🌟 ¡NUBI HA EVOLUCIONADO! 🌟",
    );

    setLastEvent("🌱 Evolución");
  }

  const knownViewer = activeViewers.find(
    (memory) =>
      memory.user.toLowerCase() ===
      viewer.toLowerCase(),
  );

  function simulateAbsence() {
    setWorld((currentWorld) => {
      const currentViewers =
        currentWorld.viewers[activePetId] ?? [];

      const currentViewer =
        currentViewers.find(
          (profile) =>
            profile.viewerId === viewerIdentity.viewerId,
        );

      if (!currentViewer) {
        setMessage(
          "👤 Primero crea un perfil interactuando con Nubi.",
        );
        setLastEvent(
          "⚠️ No hay espectador para ausentar",
        );
        return currentWorld;
      }

      const simulatedLastSeen =
        Date.now() - 6 * 60 * 1000;

      const nextViewers =
        currentViewers.map((profile) =>
          profile.viewerId ===
          currentViewer.viewerId
            ? {
                ...profile,
                lastSeen:
                  simulatedLastSeen,
              }
            : profile,
        );

      setLastEvent(
        `🧪 ${currentViewer.user} marcado como ausente`,
      );

      setMessage(
        `👀 ${currentViewer.user} lleva 6 minutos fuera...`,
      );

      return {
        ...currentWorld,
        viewers: {
          ...currentWorld.viewers,
          [activePetId]: nextViewers,
        },
      };
    });
  }

  function simulateGift(giftId: string) {
    setWorld((currentWorld) => {
      const currentPet =
        currentWorld.pets[activePetId];

      const currentViewers =
        currentWorld.viewers[activePetId] ?? [];

      let currentViewer =
        currentViewers.find(
          (profile) =>
            profile.viewerId === viewerIdentity.viewerId,
        );

      if (!currentViewer) {
        currentViewer =
          registerViewerInteraction(
            currentViewers,
            viewerIdentity,
            activePetId,
            "greet",
          ).profile;
      }

      const event: GiftEvent = {
        eventId:
          `sim-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        giftId,
        viewerId: currentViewer.viewerId,
        user: currentViewer.user,
        petId: activePetId,
        timestamp: Date.now(),
      };

      const result =
        processViewerGift(
          currentPet,
          currentViewer,
          event,
        );

      if (!result.accepted) {
        setMessage(
          result.message,
        );
        setLastEvent(
          result.duplicate
            ? "🛡️ Regalo duplicado"
            : "⚠️ Regalo rechazado",
        );

        return currentWorld;
      }

      setMessage(
        result.message,
      );

      setLastEvent(
        `🎁 ${result.gift?.name ?? "Regalo"} → @${result.viewer.user} +${result.gift?.coinValue ?? 0} 🪙`,
      );

      return {
        ...currentWorld,

        pets: {
          ...currentWorld.pets,
          [activePetId]: result.pet,
        },

        viewers: {
          ...currentWorld.viewers,
          [activePetId]:
            upsertViewerProfile(
              currentViewers,
              {
                profile: result.viewer,
                isNewViewer:
                  !currentViewers.some(
                    (profile) =>
                      profile.viewerId ===
                      result.viewer.viewerId,
                  ),
              },
            ),
        },
      };
    });
  }

  function buyReturnGreeting() {
    const currentViewers =
      world.viewers[activePetId] ?? [];

    const currentViewer =
      currentViewers.find(
        (profile) =>
          profile.viewerId ===
          viewerIdentity.viewerId,
      );

    if (!currentViewer) {
      setMessage(
        "👤 Primero interactúa con Nubi para crear tu perfil.",
      );

      setLastEvent(
        "🎁 Saludo de regreso rechazado",
      );

      return;
    }

    const message =
      window.prompt(
        `Escribe exactamente lo que quieres que Nubi diga cuando regreses.\\n\\nMáximo 180 caracteres.\\n\\nPrecio: ${RETURN_GREETING_PRICE} 🪙`,
        "",
      );

    if (message === null) {
      return;
    }

    const result =
      purchaseReturnGreeting(
        currentViewer,
        message,
      );

    if (!result.accepted) {
      setMessage(result.message);
      setLastEvent(
        "⚠️ Saludo de regreso rechazado",
      );
      return;
    }

    setWorld((currentWorld) => {
      const viewers =
        currentWorld.viewers[activePetId] ?? [];

      return {
        ...currentWorld,
        viewers: {
          ...currentWorld.viewers,
          [activePetId]:
            upsertViewerProfile(
              viewers,
              {
                profile:
                  result.viewer,
                isNewViewer: false,
              },
            ),
        },
      };
    });

    setMessage(result.message);

    setLastEvent(
      `🎁 Saludo de regreso preparado para @${result.viewer.user}`,
    );
  }

  function buyGift(giftId: string) {
    setWorld((currentWorld) => {
      const currentViewers =
        currentWorld.viewers[activePetId] ?? [];

      const currentViewer =
        currentViewers.find(
          (profile) =>
            profile.viewerId === viewerIdentity.viewerId,
        );

      if (!currentViewer) {
        setMessage(
          "👤 Primero interactúa con Nubi para crear tu perfil.",
        );

        setLastEvent(
          "🛒 Compra rechazada",
        );

        return currentWorld;
      }

      const eventId =
        `purchase-${currentViewer.viewerId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const result =
        purchaseGift(
          currentViewer,
          giftId,
          eventId,
        );

      if (!result.accepted) {
        setMessage(
          result.message,
        );

        setLastEvent(
          result.duplicate
            ? "🛡️ Compra duplicada"
            : "⚠️ Compra rechazada",
        );

        return currentWorld;
      }

      setMessage(
        result.message,
      );

      setLastEvent(
        `🛒 ${result.gift?.name ?? "Objeto"} → @${result.viewer.user}`,
      );

      return {
        ...currentWorld,

        viewers: {
          ...currentWorld.viewers,

          [activePetId]:
            upsertViewerProfile(
              currentViewers,
              {
                profile:
                  result.viewer,
                isNewViewer: false,
              },
            ),
        },
      };
    });
  }

  return (
    <main className="app">
      <section className="game-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              PET LIVE
            </span>

            <h1>{pet.name}</h1>
          </div>

          <div className="live-badge">
            <span />
            LIVE
          </div>
        </header>

        <section className="pet-area">
          <div className="stage-label">
            {stageNames[pet.stage]}
          </div>

          <div className="pet-glow" />

          <div
            className={`pet mood-${mood}${
              activeSocialEvent
                ? ` social-${activeSocialEvent.type}`
                : ""
            }`}
          >
            <div className="ear left" />
            <div className="ear right" />

            <div className="body">
              <div className="eye left-eye" />
              <div className="eye right-eye" />
              <div className="mouth">
                ⌣
              </div>
              <div className="cheek left-cheek" />
              <div className="cheek right-cheek" />
            </div>
          </div>

          {activeSocialEvent && (
            <div className="social-event">
              {activeSocialEvent.message}
            </div>
          )}

          <div className="pet-message">
            {message}
          </div>
        </section>

        <section className="stats">
          <Stat
            label="Hambre"
            value={pet.hunger}
            icon="🍎"
          />

          <Stat
            label="Felicidad"
            value={pet.happiness}
            icon="❤️"
          />

          <Stat
            label="Energía"
            value={pet.energy}
            icon="⚡"
          />

          <Stat
            label="Salud"
            value={pet.health}
            icon="💚"
          />

          <Stat
            label="Sed"
            value={pet.thirst}
            icon="💧"
          />

          <Stat
            label="Cariño"
            value={pet.love}
            icon="🥰"
          />
        </section>

        <section className="evolution">
          <div className="section-heading">
            <span>
              🌱 Crecimiento · Nivel {currentLevel}
            </span>

            <strong>
              {Math.round(
                stageProgress,
              )}
              %
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${stageProgress}%`,
              }}
            />
          </div>

          <button
            className="evolve-button"
            disabled={!canEvolve}
            onClick={evolve}
          >
            {pet.stage === "adult"
              ? "👑 NUBI ADULTO"
              : canEvolve
                ? "✨ EVOLUCIONAR"
                : `Faltan ${
                    nextStageXp -
                    pet.experience
                  } XP`}
          </button>
        </section>

        <section className="chat-panel">
          <div className="panel-title">
            <span>
              💬 CHAT DE PRUEBA
              {thinking
                ? " · 🧠 IA"
                : ""}
            </span>

            <small>
              {knownViewer
                ? `Nubi recuerda ${activeViewers.length} espectador${activeViewers.length === 1 ? "" : "es"}`
                : `Nubi recuerda ${activeViewers.length} espectador${activeViewers.length === 1 ? "" : "es"}`}
            </small>
          </div>

          <div className="chat-input-row">
            <input
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value,
                )
              }
              onKeyDown={
                handleCommentKeyDown
              }
              placeholder={
                thinking
                  ? "Nubi está pensando..."
                  : "Escribe algo para Nubi..."
              }
              aria-label="Comentario para Nubi"
              disabled={thinking}
            />

            <button
              onClick={() =>
                void sendComment()
              }
              disabled={thinking}
            >
              {thinking
                ? "..."
                : "ENVIAR"}
            </button>
          </div>

          <div className="chat-examples">
            <button
              onClick={() =>
                setComment(
                  "dale comida a Nubi",
                )
              }
            >
              🍎 Comida
            </button>

            <button
              onClick={() =>
                setComment(
                  "Nubi tiene sed",
                )
              }
            >
              💧 Agua
            </button>

            <button
              onClick={() =>
                setComment(
                  "vamos a jugar Nubi",
                )
              }
            >
              🎮 Jugar
            </button>

            <button
              onClick={() =>
                setComment(
                  "te quiero Nubi",
                )
              }
            >
              ❤️ Cariño
            </button>
          </div>
        </section>

        <section className="live-panel">
          <div className="panel-title">
            <span>
              EVENTOS DEL LIVE
            </span>

            <small>
              {lastEvent}
            </small>
          </div>

          <div
            style={{
              marginBottom: "12px",
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <strong>
                👤 ESPECTADOR ACTIVO
              </strong>

              <small>
                {activeViewers.find(
                  (profile) =>
                    profile.viewerId === viewerIdentity.viewerId,
                )?.coins ?? 0}{" "}
                🪙
              </small>
            </div>

            <select
              value={viewer}
              onChange={(event) => {
              const nextViewer = event.target.value;

              setViewer(nextViewer);

              if (nextViewer === "Espectador") {
                return;
              }

              const nextIdentity =
                getViewerIdentity(nextViewer);

              handleViewerJoin({
                viewerId: nextIdentity.viewerId,
                username: nextIdentity.username,
                displayName: nextIdentity.displayName,
              });
            }}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "inherit",
              }}
            >
              <option value="Espectador">
                Espectador
              </option>
              <option value="Juan">
                Juan
              </option>
              <option value="María">
                María
              </option>
              <option value="Carlos">
                Carlos
              </option>
              <option value="Ana">
                Ana
              </option>
              <option value="Pedro">
                Pedro
              </option>
            </select>
          </div>

          <div className="event-grid">
            <EventButton
              icon="❤️"
              label="Like"
              onClick={() =>
                applyEvent("like")
              }
            />

            <EventButton
              icon="👤"
              label="Follow"
              onClick={() =>
                applyEvent("follow")
              }
            />

            <EventButton
              icon="💬"
              label="Comment"
              onClick={() =>
                applyEvent("comment")
              }
            />

            <EventButton
              icon="🍎"
              label="Comida"
              onClick={() =>
                applyEvent("food")
              }
            />

            <EventButton
              icon="🧸"
              label="Juguete"
              onClick={() =>
                applyEvent("toy")
              }
            />

            <EventButton
              icon="⚡"
              label="Energía"
              onClick={() =>
                applyEvent("energy")
              }
            />

            <EventButton
              icon="💎"
              label="Especial"
              onClick={() =>
                applyEvent("special")
              }
              special
            />

            <EventButton
              icon="🧪"
              label="Ausencia"
              onClick={simulateAbsence}
              special
            />

            <EventButton
              icon="🍎"
              label="Manzana"
              onClick={() =>
                simulateGift("apple")
              }
            />

            <EventButton
              icon="❤️"
              label="Corazón"
              onClick={() =>
                simulateGift("heart")
              }
            />

            <EventButton
              icon="🧸"
              label="Peluche"
              onClick={() =>
                simulateGift("teddy")
              }
            />

            <EventButton
              icon="👑"
              label="Corona"
              onClick={() =>
                simulateGift("gold-crown")
              }
              special
            />
          </div>
        </section>

        <section
          className="live-panel"
          style={{
            marginTop: "14px",
          }}
        >
          <div className="panel-title">
            <span>
              🛒 TIENDA DE NUBI
            </span>

            <small>
              {activeViewers.find(
                (profile) =>
                  profile.viewerId === viewerIdentity.viewerId,
              )?.coins ?? 0}{" "}
              🪙
            </small>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "8px",
            }}
          >
            <button
              onClick={buyReturnGreeting}
              disabled={
                !((activeViewers.find(
                  (profile) =>
                    profile.viewerId ===
                    viewerIdentity.viewerId,
                )?.coins ?? 0) >=
                RETURN_GREETING_PRICE)
              }
              style={{
                gridColumn: "1 / -1",
                padding: "12px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,215,80,0.22)",
                background:
                  "rgba(255,215,80,0.08)",
                color: "inherit",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  marginBottom: "4px",
                }}
              >
                🎁
              </div>

              <strong>
                Saludo de regreso
              </strong>

              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.7,
                  marginTop: "4px",
                }}
              >
                Escribe lo que Nubi dirá cuando regreses ·{" "}
                {RETURN_GREETING_PRICE} 🪙
              </div>
            </button>

            {GIFT_CATALOG.map((gift) => {
              const currentViewer =
                activeViewers.find(
                  (profile) =>
                    profile.viewerId === viewerIdentity.viewerId,
                );

              const canBuy =
                (currentViewer?.coins ?? 0) >=
                gift.coinValue;

              return (
                <button
                  key={gift.id}
                  onClick={() =>
                    buyGift(gift.id)
                  }
                  disabled={
                    !currentViewer ||
                    !canBuy
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background:
                      canBuy
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.025)",
                    color: "inherit",
                    cursor:
                      canBuy
                        ? "pointer"
                        : "not-allowed",
                    opacity:
                      canBuy
                        ? 1
                        : 0.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      marginBottom: "4px",
                    }}
                  >
                    {gift.type === "food"
                      ? "🍎"
                      : gift.type === "affection"
                        ? "❤️"
                        : gift.type === "toy"
                          ? "🧸"
                          : gift.type === "clothing"
                            ? "👕"
                            : gift.type === "accessory"
                              ? "⭐"
                              : "👑"}
                  </div>

                  <strong>
                    {gift.name}
                  </strong>

                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginTop: "4px",
                    }}
                  >
                    {gift.coinValue} 🪙
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="nubi-switcher">
          <div className="panel-title">
            <span>
              ⚔️ NUBI BATTLE
            </span>

            <small>
              Selecciona qué Nubi recibe las
              interacciones
            </small>
          </div>

          <div className="nubi-switch-buttons">
            <button
              className={
                activeSide === "A"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSide("A")
              }
            >
              🔵 Nubi
            </button>

            <button
              className={
                activeSide === "B"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSide("B")
              }
            >
              🔴 Nubi
            </button>
          </div>
        </section>

        <footer>
          <span>
            Tu chat está criando a Nubi.
          </span>

          <span>
            LIVE #001
          </span>
        </footer>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>
          {icon} {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="stat-track">
        <div
          className="stat-fill"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

function EventButton({
  icon,
  label,
  onClick,
  special = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  special?: boolean;
}) {
  return (
    <button
      className={`event-button${
        special
          ? " event-button-special"
          : ""
      }`}
      onClick={onClick}
    >
      <span>
        {icon}
      </span>

      {label}
    </button>
  );
}

export default App;
