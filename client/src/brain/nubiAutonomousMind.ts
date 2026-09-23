import type { ChatAction } from "../chat/interpreter";
import type { NubiState } from "./nubiState";
import type { NubiEpisode } from "../nubi/memory/episodicMemory";
import {
  calculateNubiDesires,
  type NubiDesireType,
} from "./nubiDesires";
import { chooseDominantDesire } from "./nubiDesireEngine";
import { createNubiThought } from "./nubiThoughts";
import type {
  NubiSocialMemory,
  NubiSocialPerson,
} from "./nubiSocialMemory";

export type AutonomousIntent =
  | "need"
  | "social"
  | "play"
  | "rest"
  | "curiosity"
  | "mischief"
  | "idle";

export type AutonomousDecision = {
  desire?: NubiDesireType | null;
  intent: AutonomousIntent;
  action: ChatAction | null;
  reason: string;
  mood: string;
  response: string;
  priority: number;
  targetViewer?: string | null;
  thought?: string | null;
};

type Candidate = AutonomousDecision;

function randomItem<T>(items: T[]): T {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function addCandidate(
  candidates: Candidate[],
  candidate: Candidate,
): void {
  candidates.push(candidate);
}

function selectSocialTarget(
  people: NubiSocialPerson[],
  desiredRole:
    | "caregiver"
    | "playmate"
    | "affectionate"
    | "companion"
    | "mixed"
    | null = null,
): NubiSocialPerson | null {
  /*
   * Una interacción social directa necesita presencia real.
   * Nubi puede recordar a alguien que lleva tiempo ausente,
   * pero no debe actuar como si esa persona siguiera en el LIVE.
   */
  const presenceWindow =
    5 * 60 * 1000;

  const eligible = people.filter(
    (person) =>
      person.familiarity !== "stranger" &&
      Date.now() - person.lastSeen <
        presenceWindow,
  );

  if (eligible.length === 0) {
    return null;
  }

  const scored = eligible.map((person) => {
    let score = person.bond;

    if (
      desiredRole &&
      person.role === desiredRole
    ) {
      score += 25;
    }

    if (person.role === "mixed") {
      score += 8;
    }

    const elapsed =
      Math.max(
        0,
        Date.now() - person.lastSeen,
      );

    if (elapsed < 60 * 1000) {
      score += 35;
    } else if (
      elapsed < 3 * 60 * 1000
    ) {
      score += 20;
    } else {
      score += 10;
    }

    score += Math.random() * 15;

    return {
      person,
      score,
    };
  });

  scored.sort(
    (a, b) => b.score - a.score,
  );

  return scored[0]?.person ?? null;
}

function personalizeSocialResponse(
  response: string,
  target: NubiSocialPerson | null,
): string {
  if (!target) {
    return response;
  }

  if (response.includes("chat")) {
    return response.replace(
      "chat",
      target.user,
    );
  }

  return `${response} ${target.user} 🐾`;
}

/**
 * El Autonomous Mind decide qué quiere hacer Nubi.
 *
 * Importante:
 * - No ejecuta acciones.
 * - No modifica el estado.
 * - No llama a Gemini.
 *
 * Solamente produce una intención.
 *
 * El Nubi Brain sigue siendo quien decide
 * si esa intención puede ejecutarse.
 */
export function chooseAutonomousDecision(
  state: NubiState,
  recentChatActivity = 0,
  episodicMemories: NubiEpisode[] = [],
  socialMemory: NubiSocialMemory | null = null,
): AutonomousDecision | null {
  const candidates: Candidate[] = [];

  /*
   * =====================================================
   * MEMORIA SOCIAL
   * =====================================================
   *
   * Nubi no trata a todos los espectadores igual.
   * El contexto social aumenta ligeramente sus deseos
   * de compañía cuando ya existen relaciones reales.
   *
   * Esto no modifica el estado ni ejecuta acciones.
   */

  const knownPeople =
    socialMemory?.totalKnownPeople ?? 0;

  const trustedPeople =
    socialMemory?.people.filter(
      (person) =>
        person.familiarity === "trusted" ||
        person.familiarity === "close",
    ).length ?? 0;

  const socialContext =
    Math.min(
      20,
      knownPeople * 2 +
        trustedPeople * 4,
    );

  /*
   * =====================================================
   * DESEOS INTERNOS
   * =====================================================
   */

  const desires = calculateNubiDesires(
    state,
    recentChatActivity,
  );

  const sociallyAdjustedDesires =
    desires.map((desire) => {
      if (
        desire.type === "social" ||
        desire.type === "comfort"
      ) {
        return {
          ...desire,
          strength: Math.min(
            100,
            desire.strength +
              socialContext,
          ),
        };
      }

      return desire;
    });

  const dominantDesire =
    chooseDominantDesire(
      state,
      sociallyAdjustedDesires,
      {
        recentChatActivity,
      },
    );

  /*
   * =====================================================
   * DESEOS FÍSICOS
   * =====================================================
   */

  const hungerDesire =
    desires.find(
      (desire) => desire.type === "hunger",
    )?.strength ?? 0;

  const thirstDesire =
    desires.find(
      (desire) => desire.type === "thirst",
    )?.strength ?? 0;

  /*
   * =====================================================
   * NECESIDADES REALES
   * =====================================================
   *
   * Aquí convertimos los deseos calculados en señales
   * que el Autonomous Mind puede utilizar.
   */

  /*
   * =====================================================
   * NECESIDADES REALES
   * =====================================================
   */

  if (state.illness === "sick") {
    addCandidate(candidates, {
      intent: "need",
      action: "comfort",
      reason: "Nubi no se siente bien.",
      mood: "sad",
      response:
        "Nubi no se siente muy bien... 🥺🐾 ¿Alguien se queda con ella?",
      priority: 100,
    });
  }

  if (
    state.thirst <= 15 ||
    thirstDesire >= 85
  ) {
    addCandidate(candidates, {
      intent: "need",
      action: "drink",
      reason: "Nubi tiene mucha sed.",
      mood: "sad",
      response:
        "Nubi tiene muchísima sed... 💧🥺 ¿Me dan agüita?",
      priority: 98,
    });
  }

  if (
    state.hunger <= 15 ||
    hungerDesire >= 85
  ) {
    addCandidate(candidates, {
      intent: "need",
      action: "feed",
      reason: "Nubi tiene mucha hambre.",
      mood: "hungry",
      response:
        "Nubi tiene MUCHA hambre... 🍎🥺 ¿Quién me alimenta?",
      priority: 97,
    });
  }

  if (state.bathroom >= 90) {
    addCandidate(candidates, {
      intent: "need",
      action: "toilet",
      reason: "Nubi necesita ir al baño.",
      mood: "uncomfortable",
      response:
        "Nubi necesita ir al baño... 👀🚽",
      priority: 94,
    });
  }

  if (state.hygiene <= 15) {
    addCandidate(candidates, {
      intent: "need",
      action: "bath",
      reason: "Nubi está muy sucia.",
      mood: "uncomfortable",
      response:
        "Ejem... Nubi necesita urgentemente un bañito 🫣🛁",
      priority: 92,
    });
  }

  if (state.energy <= 15) {
    addCandidate(candidates, {
      intent: "rest",
      action: "sleep",
      reason: "Nubi está agotada.",
      mood: "sleepy",
      response:
        "Nubi ya no puede mantener los ojitos abiertos... 😴🐾",
      priority: 96,
    });
  }

  /*
   * =====================================================
   * DESEO DE JUGAR
   * =====================================================
   *
   * La personalidad empieza a importar aquí.
   *
   * Una Nubi muy juguetona tendrá más probabilidades
   * de querer jugar espontáneamente.
   */

  const playDesire =
    desires.find(
      (desire) => desire.type === "play",
    )?.strength ?? 0;

  if (
    state.energy > 45 &&
    state.hunger > 35 &&
    state.thirst > 35 &&
    playDesire >= 75
  ) {
    const playTarget =
      selectSocialTarget(
        socialMemory?.people ?? [],
        "playmate",
      );

    addCandidate(candidates, {
      intent: "play",
      action: "play",
      targetViewer:
        playTarget?.user ?? null,
      reason:
        playTarget
          ? `Nubi tiene ganas de jugar con ${playTarget.user}.`
          : "Nubi tiene ganas de jugar.",
      mood: "playful",
      response:
        personalizeSocialResponse(
          "Nubi está mirando el chat... creo que quiere jugar 👀🎾🐾",
          playTarget,
        ),
      priority:
        55 + state.personality.playful * 0.25,
    });
  }

  /*
   * =====================================================
   * CARIÑO / SOCIAL
   * =====================================================
   */

  const affectionDesire =
    desires.find(
      (desire) => desire.type === "comfort",
    )?.strength ?? 0;

  if (affectionDesire >= 70) {
    const affectionTarget =
      selectSocialTarget(
        socialMemory?.people ?? [],
        "affectionate",
      );

    addCandidate(candidates, {
      intent: "social",
      action: "pet",
      targetViewer:
        affectionTarget?.user ?? null,
      reason:
        affectionTarget
          ? `Nubi quiere recibir cariño de ${affectionTarget.user}.`
          : "Nubi quiere recibir cariño de la comunidad.",
      mood: "affectionate",
      response:
        personalizeSocialResponse(
          "Nubi se acerca al chat buscando mimitos 🥺🐾💕",
          affectionTarget,
        ),
      priority:
        48 + state.personality.affectionate * 0.18,
    });
  }

  /*
   * =====================================================
   * CURIOSIDAD
   * =====================================================
   *
   * La curiosidad no necesita convertirse siempre
   * en una acción del juego.
   *
   * Puede simplemente hacer que Nubi observe.
   */

  const curiosityDesire =
    desires.find(
      (desire) => desire.type === "curiosity",
    )?.strength ?? 0;

  if (
    curiosityDesire >= 70 &&
    recentChatActivity > 0
  ) {
    addCandidate(candidates, {
      intent: "curiosity",
      action: null,
      reason:
        "Algo en la actividad del chat llamó la atención de Nubi.",
      mood: "curious",
      response:
        "Nubi está mirando el chat con mucha curiosidad... 👀🐾",
      priority:
        35 + state.personality.curiosity * 0.2,
    });
  }

  /*
   * =====================================================
   * TRAVESURA
   * =====================================================
   */

  const mischiefDesire =
    desires.find(
      (desire) => desire.type === "mischief",
    )?.strength ?? 0;

  if (
    mischiefDesire >= 70 &&
    state.energy > 40
  ) {
    const mischiefTarget =
      selectSocialTarget(
        socialMemory?.people ?? [],
        "playmate",
      );

    addCandidate(candidates, {
      intent: "mischief",
      action: "tease",
      targetViewer:
        mischiefTarget?.user ?? null,
      reason:
        mischiefTarget
          ? `Nubi está pensando en hacerle una travesura a ${mischiefTarget.user}.`
          : "Nubi tiene ganas de hacer una pequeña travesura.",
      mood: "mischievous",
      response:
        mischiefTarget
          ? `Nubi está pensando en hacerle una travesura a ${mischiefTarget.user}... 😏🐾`
          : "Nubi está pensando en hacer una travesura... 😏🐾",
      priority:
        30 + state.personality.mischievous * 0.2,
    });
  }

  /*
   * =====================================================
   * IDLE / PERSONALIDAD
   * =====================================================
   *
   * Nubi también puede simplemente existir.
   * No todo momento necesita una acción.
   */

  if (
    state.personality.curiosity >= 80 &&
    state.happiness >= 60
  ) {
    addCandidate(candidates, {
      intent: "idle",
      action: null,
      reason: "Nubi está tranquila y observando.",
      mood: "curious",
      response: randomItem([
        "Nubi está tranquilita observando todo 👀🐾",
        "Nubi mira alrededor... 👀✨",
        "Nubi se quedó curioseando por aquí 🐾👀",
      ]),
      priority: 10,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  /*
   * =====================================================
   * SELECCIÓN
   * =====================================================
   *
   * Primero encontramos la prioridad máxima.
   * Después dejamos una pequeña variación aleatoria
   * para que Nubi no sea completamente determinista.
   */

  const maxPriority = Math.max(
    ...candidates.map(
      (candidate) => candidate.priority,
    ),
  );

  const finalists = candidates.filter(
    (candidate) =>
      candidate.priority >= maxPriority - 12,
  );

  const dominantIntentMap: Partial<
    Record<NubiDesireType, AutonomousIntent>
  > = {
    hunger: "need",
    thirst: "need",
    rest: "rest",
    comfort: "social",
    play: "play",
    curiosity: "curiosity",
    mischief: "mischief",
    social: "social",
    cleanliness: "need",
    bathroom: "need",
    recovery: "need",
    idle: "idle",
  };

  const dominantIntent =
    dominantDesire
      ? dominantIntentMap[
          dominantDesire.desire
        ]
      : undefined;

  const alignedFinalists =
    dominantIntent
      ? finalists.filter(
          (candidate) =>
            candidate.intent === dominantIntent,
        )
      : [];

  const pool =
    alignedFinalists.length > 0
      ? alignedFinalists
      : finalists;

  const selected = randomItem(pool);

  const selectedDesire =
    dominantDesire ??
    {
      desire:
        selected.intent === "play"
          ? "play"
          : selected.intent === "social"
            ? "social"
            : selected.intent === "rest"
              ? "rest"
              : selected.intent === "curiosity"
                ? "curiosity"
                : selected.intent === "mischief"
                  ? "mischief"
                  : "idle",
      strength: selected.priority,
      reason: selected.reason,
    };

  const thought = createNubiThought(
    state,
    selectedDesire,
    episodicMemories,
    socialMemory,
  );

  return {
    ...selected,
    desire: selectedDesire.desire,
    priority: clamp(selected.priority),
    thought: thought?.text ?? null,
  };
}
