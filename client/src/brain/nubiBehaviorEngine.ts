import type { NubiState } from "./nubiState";

export type NubiBehaviorPriority =
  | "critical"
  | "high"
  | "medium";

export type NubiBehavior = {
  key: string;
  priority: NubiBehaviorPriority;
  mood: string;
  response: string;
};

type BehaviorCandidate = {
  key: string;
  priority: NubiBehaviorPriority;
  mood: string;
  responses: string[];
};

const PRIORITY_VALUE: Record<
  NubiBehaviorPriority,
  number
> = {
  critical: 3,
  high: 2,
  medium: 1,
};

function randomItem<T>(items: T[]): T {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

function getCandidates(
  state: NubiState,
): BehaviorCandidate[] {
  const candidates: BehaviorCandidate[] = [];

  if (state.illness === "sick") {
    candidates.push({
      key: "sick",
      priority: "critical",
      mood: "sad",
      responses: [
        "Nubi no se siente nada bien... 🥺🐾",
        "Nubi está enfermita y necesita mimitos 🥺",
        "Hoy Nubi no tiene muchas ganas de nada... 🤒🐾",
      ],
    });
  }

  if (state.thirst <= 15) {
    candidates.push({
      key: "thirst-critical",
      priority: "critical",
      mood: "sad",
      responses: [
        "Nubi tiene muchísima sed... 💧🥺",
        "¿Alguien le da agüita a Nubi? 💧🐾",
        "Nubi está buscando agua desesperadamente 👀💧",
      ],
    });
  }

  if (state.hunger <= 15) {
    candidates.push({
      key: "hunger-critical",
      priority: "critical",
      mood: "sad",
      responses: [
        "Nubi tiene MUCHA hambre... 🍗🥺",
        "Creo que Nubi necesita comer algo ya... 👀🍗",
        "Nubi está empezando a pensar seriamente en comida... 😭🍖",
      ],
    });
  }

  if (state.energy <= 15) {
    candidates.push({
      key: "energy-critical",
      priority: "critical",
      mood: "sleepy",
      responses: [
        "Nubi se está quedando dormido... 🥱💤",
        "Nubi ya no puede mantener los ojitos abiertos... 😴",
        "Creo que Nubi necesita una siestecita... 🥱🐾",
      ],
    });
  }

  if (state.bathroom >= 90) {
    candidates.push({
      key: "bathroom-urgent",
      priority: "high",
      mood: "uncomfortable",
      responses: [
        "Nubi está aguantándose demasiado... 🚽🥺",
        "Nubi necesita ir al baño... 👀🚽",
        "Esto ya se está poniendo urgente... 😭🚽",
      ],
    });
  }

  if (state.hygiene <= 20) {
    candidates.push({
      key: "dirty",
      priority: "high",
      mood: "uncomfortable",
      responses: [
        "Nubi cree que necesita un bañito... 👀🛁",
        "Ejem... Nubi lleva demasiado tiempo sin bañarse... 🫣",
        "Nubi está un poquito... bastante... sucio 😭🛁",
      ],
    });
  }

  if (state.hunger <= 30) {
    candidates.push({
      key: "hunger-low",
      priority: "medium",
      mood: "hungry",
      responses: [
        "Nubi empieza a tener un poquito de hambre... 🍗🐾",
        "Mmm... Nubi está pensando en comida 👀🍖",
      ],
    });
  }

  if (state.thirst <= 30) {
    candidates.push({
      key: "thirst-low",
      priority: "medium",
      mood: "thirsty",
      responses: [
        "Nubi tiene un poquito de sed... 💧🐾",
        "Nubi mira el agua con cara de \"mmm...\" 👀💧",
      ],
    });
  }

  if (state.energy <= 30) {
    candidates.push({
      key: "energy-low",
      priority: "medium",
      mood: "sleepy",
      responses: [
        "Nubi empieza a sentir sueño... 🥱",
        "Nubi podría dormir un ratito... 😴🐾",
      ],
    });
  }

  if (state.hygiene <= 35) {
    candidates.push({
      key: "dirty-low",
      priority: "medium",
      mood: "uncomfortable",
      responses: [
        "Nubi siente que necesita un bañito pronto... 🛁🐾",
        "Nubi se mira y piensa: \"creo que toca baño\" 🫣",
      ],
    });
  }

  return candidates;
}

export function chooseNubiBehavior(
  state: NubiState,
  blockedKeys: string[] = [],
): NubiBehavior | null {
  const blocked = new Set(blockedKeys);

  const available = getCandidates(state)
    .filter(
      (candidate) =>
        !blocked.has(candidate.key),
    )
    .sort(
      (a, b) =>
        PRIORITY_VALUE[b.priority] -
        PRIORITY_VALUE[a.priority],
    );

  if (available.length === 0) {
    return null;
  }

  /*
   * Solo consideramos comportamientos de la prioridad
   * más alta disponible. Así una necesidad crítica
   * no queda escondida por un comentario secundario.
   */
  const highestPriority =
    PRIORITY_VALUE[available[0].priority];

  const highest = available.filter(
    (candidate) =>
      PRIORITY_VALUE[candidate.priority] ===
      highestPriority,
  );

  const selected = randomItem(highest);

  /*
   * La personalidad modifica ligeramente la frecuencia
   * de expresión, pero no cambia las necesidades reales.
   *
   * Un Nubi muy cariñoso tiende a pedir ayuda.
   * Un Nubi travieso puede expresarlo de forma más juguetona.
   */
  let response = randomItem(
    selected.responses,
  );

  if (
    state.personality.affectionate >= 85 &&
    selected.priority !== "critical"
  ) {
    response = response.replace(
      /🐾$/,
      "🥺🐾",
    );
  }

  if (
    state.personality.mischievous >= 80 &&
    selected.key === "dirty"
  ) {
    response =
      "Nubi necesita un baño... pero está considerando seriamente escapar 😂🛁";
  }

  return {
    key: selected.key,
    priority: selected.priority,
    mood: selected.mood,
    response,
  };
}
