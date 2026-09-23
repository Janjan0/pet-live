import type { PetId } from "../world/petTypes";
import type { PetAppearance, PetInventory } from "../inventory/types";
import type { PersonalityHistory } from "../world/personalityHistory";

export type NubiStage = "egg" | "baby" | "child" | "adult";

export type NubiIllness =
  | "healthy"
  | "unwell"
  | "sick";

export type NubiPersonality = {
  curiosity: number;
  playful: number;
  affectionate: number;
  mischievous: number;
};

export type PetMemory = {
  user: string;
  action: string;
  timestamp: number;
};

export type PetState = {
  id: PetId;
  name: string;

  /**
   * Fecha de nacimiento de Nubi.
   *
   * La edad se calcula a partir de esta fecha para que
   * Nubi no tenga una edad escrita de forma fija.
   */
  birthDate: number;

  stage: NubiStage;

  // 0 = necesidad máxima / 100 = satisfecho
  hunger: number;
  thirst: number;
  energy: number;
  happiness: number;
  health: number;
  love: number;
  social: number;

  // 0 = completamente sucio / 100 = completamente limpio
  hygiene: number;

  // 0 = acaba de ir al baño / 100 = necesita ir urgentemente
  bathroom: number;

  illness: NubiIllness;

  experience: number;

  personality: NubiPersonality;

  personalityHistory: PersonalityHistory;

  currentAction: string | null;

  lastInteraction: PetMemory | null;

  // Última vez que el motor de vida procesó a Nubi.
  lastLifeUpdate: number;

  cooldowns: Record<string, number>;

  inventory: PetInventory;

  appearance: PetAppearance;
};

export type NubiState = PetState;

export function createInitialPetState(
  config: Partial<Pick<PetState, "id" | "name">> = {},
): PetState {
  return {
    id: config.id ?? "nubi-1",
    name: config.name ?? "Nubi",

    // Nubi nace el día en que estamos creando esta versión.
    // Su edad se calcula dinámicamente a partir de aquí.
    birthDate: new Date("2026-09-22T00:00:00").getTime(),

    stage: "baby",

    hunger: 72,
    thirst: 68,
    energy: 68,
    happiness: 78,
    health: 94,
    love: 0,
    social: 0,

    hygiene: 100,
    bathroom: 0,
    illness: "healthy",

    experience: 0,

    personality: {
      curiosity: 82,
      playful: 71,
      affectionate: 94,
      mischievous: 63,
    },

    personalityHistory: {
      affection: 0,
      care: 0,
      play: 0,
      mischief: 0,
      curiosity: 0,
      gifts: 0,
      totalInteractions: 0,
      recentActions: [],
    },

    currentAction: null,
    lastInteraction: null,
    lastLifeUpdate: Date.now(),
    cooldowns: {},

    inventory: {
      owned: [],
      equipped: [],
    },

    appearance: {
      clothing: null,
      accessory: null,
      toy: null,
      special: null,
    },
  };
}

export const initialNubiState: NubiState = createInitialPetState({
  id: "nubi-1",
  name: "Nubi",
});

export type NubiMemory = PetMemory;
