import type { PetState } from "../brain/nubiState";
import {
  evolvePersonalityFromCommunity,
} from "./communityInfluence";
import type { NubiCommunity } from "./community";
import {
  calculatePersonalityTrend,
} from "./personalityHistory";
import {
  getLevelFromExperience,
  getPersonalityEvolutionStrength,
} from "./progression";

function clamp(value: number): number {
  return Math.max(
    0,
    Math.min(100, value),
  );
}

function calculateResistance(
  current: number,
  target: number,
): number {
  const distance =
    Math.abs(target - current);

  return Math.max(
    0.35,
    1 - distance / 140,
  );
}

function calculateRecentWeight(
  totalInteractions: number,
): number {
  /*
   * La memoria reciente tiene más importancia
   * cuando Nubi todavía está empezando.
   *
   * A medida que acumula experiencias,
   * su identidad se vuelve más estable.
   */
  if (totalInteractions <= 10) {
    return 0.45;
  }

  if (totalInteractions <= 50) {
    return 0.35;
  }

  if (totalInteractions <= 150) {
    return 0.30;
  }

  if (totalInteractions <= 500) {
    return 0.25;
  }

  return 0.20;
}

function buildHistoricalInfluence(
  pet: PetState,
): {
  affectionate: number;
  playful: number;
  mischievous: number;
  curious: number;
} {
  const history =
    pet.personalityHistory;

  const trend =
    calculatePersonalityTrend(
      history,
    );

  /*
   * Convertimos las tendencias históricas
   * a una escala compatible con personalidad.
   *
   * Las acciones no dictan directamente
   * la personalidad: solamente ejercen presión.
   */
  const total =
    history.affection +
    history.care +
    history.play +
    history.mischief +
    history.curiosity;

  if (total <= 0) {
    return {
      affectionate: pet.personality.affectionate,
      playful: pet.personality.playful,
      mischievous: pet.personality.mischievous,
      curious: pet.personality.curiosity,
    };
  }

  return {
    affectionate:
      clamp(
        trend.affection * 100 +
        trend.care * 15,
      ),

    playful:
      clamp(
        trend.play * 100 +
        trend.affection * 10,
      ),

    mischievous:
      clamp(
        trend.mischief * 100 +
        trend.play * 45 +
        (1 - trend.care) * 20,
      ),

    curious:
      clamp(
        trend.curiosity * 100 +
        trend.play * 35 +
        trend.care * 15,
      ),
  };
}

function blendInfluences(
  community: {
    affectionate: number;
    playful: number;
    mischievous: number;
    curious: number;
  },
  history: {
    affectionate: number;
    playful: number;
    mischievous: number;
    curious: number;
  },
  recentWeight: number,
) {
  const historyWeight =
    1 - recentWeight;

  return {
    affectionate:
      history.affectionate *
        historyWeight +
      community.affectionate *
        recentWeight,

    playful:
      history.playful *
        historyWeight +
      community.playful *
        recentWeight,

    mischievous:
      history.mischievous *
        historyWeight +
      community.mischievous *
        recentWeight,

    curious:
      history.curious *
        historyWeight +
      community.curious *
        recentWeight,
  };
}

export type PersonalityEvolutionResult = {
  pet: PetState;
  changed: boolean;
  level: number;
  strength: number;
};

export function evolveNubiPersonality(
  pet: PetState,
  community: NubiCommunity,
): PersonalityEvolutionResult {
  const level =
    getLevelFromExperience(
      pet.experience,
    );

  const strength =
    getPersonalityEvolutionStrength(
      level,
    );

  const communityPersonality =
    evolvePersonalityFromCommunity(
      {
        curiosity: 0,
        playful: 0,
        affectionate: 0,
        mischievous: 0,
      },
      community,
      1,
    );

  const communityInfluence = {
    affectionate:
      communityPersonality.affectionate,

    playful:
      communityPersonality.playful,

    mischievous:
      communityPersonality.mischievous,

    curious:
      communityPersonality.curiosity,
  };

  const historicalInfluence =
    buildHistoricalInfluence(
      pet,
    );

  const recentWeight =
    calculateRecentWeight(
      pet.personalityHistory
        .totalInteractions,
    );

  const target =
    blendInfluences(
      historicalInfluence,
      communityInfluence,
      recentWeight,
    );

  const curiosityResistance =
    calculateResistance(
      pet.personality.curiosity,
      target.curious,
    );

  const playfulResistance =
    calculateResistance(
      pet.personality.playful,
      target.playful,
    );

  const affectionateResistance =
    calculateResistance(
      pet.personality.affectionate,
      target.affectionate,
    );

  const mischievousResistance =
    calculateResistance(
      pet.personality.mischievous,
      target.mischievous,
    );

  const nextPersonality = {
    curiosity:
      clamp(
        pet.personality.curiosity +
        (target.curious -
          pet.personality.curiosity) *
        strength *
        curiosityResistance,
      ),

    playful:
      clamp(
        pet.personality.playful +
        (target.playful -
          pet.personality.playful) *
        strength *
        playfulResistance,
      ),

    affectionate:
      clamp(
        pet.personality.affectionate +
        (target.affectionate -
          pet.personality.affectionate) *
        strength *
        affectionateResistance,
      ),

    mischievous:
      clamp(
        pet.personality.mischievous +
        (target.mischievous -
          pet.personality.mischievous) *
        strength *
        mischievousResistance,
      ),
  };

  const changed =
    nextPersonality.curiosity !==
      pet.personality.curiosity ||
    nextPersonality.playful !==
      pet.personality.playful ||
    nextPersonality.affectionate !==
      pet.personality.affectionate ||
    nextPersonality.mischievous !==
      pet.personality.mischievous;

  if (!changed) {
    return {
      pet,
      changed: false,
      level,
      strength,
    };
  }

  return {
    pet: {
      ...pet,
      personality: nextPersonality,
    },
    changed: true,
    level,
    strength,
  };
}
