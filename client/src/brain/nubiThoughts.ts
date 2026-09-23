import type { NubiDesireDecision } from "./nubiDesireEngine";
import type { NubiState } from "./nubiState";
import type { NubiEpisode } from "../nubi/memory/episodicMemory";
import type { NubiSocialMemory } from "./nubiSocialMemory";
import {
  createRelationshipThought,
  createRelationshipPresenceThought,
} from "./nubiRelationshipThoughts";

export type NubiThought = {
  text: string;
  desire: NubiDesireDecision["desire"];
  intensity: number;
};

const thoughts: Record<
  NubiThought["desire"],
  string[]
> = {
  hunger: [
    "Nubi está pensando en comida.",
    "Nubi empieza a tener ganas de comer.",
    "Algo rico le vendría bien a Nubi.",
  ],

  thirst: [
    "Nubi está pensando en tomar agua.",
    "Nubi siente que necesita beber algo.",
    "Nubi tiene ganas de tomar agua.",
  ],

  rest: [
    "Nubi empieza a pensar en descansar.",
    "Nubi siente que necesita un poquito de descanso.",
    "Nubi quiere cerrar los ojos un rato.",
  ],

  comfort: [
    "Nubi quiere sentirse querida.",
    "Nubi está buscando un poquito de cariño.",
    "Nubi tiene ganas de recibir atención.",
  ],

  play: [
    "Nubi tiene ganas de jugar.",
    "Nubi está pensando en hacer algo divertido.",
    "Nubi se siente juguetona.",
  ],

  curiosity: [
    "Algo llamó la atención de Nubi.",
    "Nubi se pregunta qué estará pasando.",
    "Nubi siente curiosidad.",
  ],

  mischief: [
    "Nubi está pensando en hacer una travesura.",
    "A Nubi se le está ocurriendo algo...",
    "Nubi tiene una idea un poquito peligrosa.",
  ],

  social: [
    "Nubi quiere compañía.",
    "Nubi está pendiente del chat.",
    "Nubi quiere interactuar con alguien.",
  ],

  cleanliness: [
    "Nubi empieza a sentirse sucia.",
    "Nubi piensa que necesita un baño.",
    "Nubi quiere volver a estar limpia.",
  ],

  bathroom: [
    "Nubi necesita ir al baño.",
    "Nubi está intentando aguantar...",
    "Nubi ya está pensando seriamente en el baño.",
  ],

  recovery: [
    "Nubi no se siente muy bien.",
    "Nubi necesita que la cuiden.",
    "Nubi siente que algo no anda bien.",
  ],

  idle: [
    "Nubi está tranquila.",
    "Nubi está observando todo.",
    "Nubi simplemente disfruta el momento.",
  ],
};

export function createNubiThought(
  state: NubiState,
  decision: NubiDesireDecision | null,
  episodicMemories: NubiEpisode[] = [],
  socialMemory: NubiSocialMemory | null = null,
): NubiThought | null {
  if (!decision) {
    return null;
  }

  const options = thoughts[decision.desire];

  if (!options || options.length === 0) {
    return null;
  }

  /*
   * La memoria no reemplaza el pensamiento actual.
   *
   * Primero Nubi piensa según lo que necesita.
   * Después, ocasionalmente, una experiencia importante
   * puede darle contexto al pensamiento.
   */
  let text =
    options[
      Math.floor(Math.random() * options.length)
    ];

  const recentImportantMemory =
    [...episodicMemories]
      .filter(
        (episode) =>
          episode.importance >= 60,
      )
      .sort(
        (a, b) =>
          b.timestamp - a.timestamp,
      )[0];

  /*
   * Una memoria importante puede aparecer de forma
   * ocasional, especialmente cuando Nubi está tranquila.
   *
   * No queremos que Nubi repita recuerdos constantemente.
   */
  const memoryCanSurface =
    recentImportantMemory &&
    state.happiness >= 50 &&
    Math.random() < 0.18;

  if (memoryCanSurface) {
    text =
      `${text} ${recentImportantMemory.summary}`;
  }

  /*
   * =====================================================
   * PENSAMIENTO RELACIONAL
   * =====================================================
   *
   * Nubi no trata a todas las personas igual.
   *
   * El pensamiento se genera a partir de:
   *
   * relación → rol → patrón → pensamiento
   *
   * El módulo relacional se encarga de convertir esos
   * datos en una frase natural.
   */

  const familiarPeople =
    (socialMemory?.people ?? []).filter(
      (person) =>
        person.familiarity === "known" ||
        person.familiarity === "familiar" ||
        person.familiarity === "trusted" ||
        person.familiarity === "close",
    );

  if (
    familiarPeople.length > 0 &&
    state.happiness >= 50 &&
    Math.random() < 0.22
  ) {
    const person =
      familiarPeople[
        Math.floor(
          Math.random() *
            familiarPeople.length,
        )
      ];

    const relationalThought =
      createRelationshipThought(person);

    if (relationalThought) {
      text =
        `${text} ${relationalThought}`;
    }
  }

  /*
   * Ocasionalmente Nubi también puede notar la
   * presencia o ausencia reciente de alguien.
   *
   * Es deliberadamente menos frecuente que un
   * pensamiento relacional normal.
   */

  if (
    familiarPeople.length > 0 &&
    state.happiness >= 55 &&
    Math.random() < 0.08
  ) {
    const person =
      familiarPeople[
        Math.floor(
          Math.random() *
            familiarPeople.length,
        )
      ];

    const presenceThought =
      createRelationshipPresenceThought(person);

    if (presenceThought) {
      text =
        `${text} ${presenceThought}`;
    }
  }

  /*
   * El estado corporal también modifica el tono mental.
   */
  if (
    decision.desire === "rest" &&
    state.energy < 25
  ) {
    text =
      "Nubi siente que necesita descansar de verdad...";
  }

  if (
    decision.desire === "hunger" &&
    state.hunger < 25
  ) {
    text =
      "Nubi no puede dejar de pensar en comida...";
  }

  if (
    decision.desire === "thirst" &&
    state.thirst < 25
  ) {
    text =
      "Nubi siente que necesita agüita...";
  }

  const intensity = Math.max(
    0,
    Math.min(
      100,
      decision.strength,
    ),
  );

  return {
    text,
    desire: decision.desire,
    intensity,
  };
}
