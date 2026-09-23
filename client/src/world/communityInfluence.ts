import type { NubiPersonality } from "../brain/nubiState";
import type { NubiCommunity } from "./community";

export type CommunityInfluence = {
  affectionate: number;
  playful: number;
  mischievous: number;
  curious: number;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function ratio(
  value: number,
  total: number,
): number {
  if (total <= 0) return 0;

  return value / total;
}

export function calculateCommunityInfluence(
  community: NubiCommunity,
): CommunityInfluence {
  const total =
    community.totalAffection +
    community.totalCare +
    community.totalPlay;

  if (total <= 0) {
    return {
      affectionate: 0,
      playful: 0,
      mischievous: 0,
      curious: 0,
    };
  }

  const affection = ratio(
    community.totalAffection,
    total,
  );

  const care = ratio(
    community.totalCare,
    total,
  );

  const play = ratio(
    community.totalPlay,
    total,
  );

  /*
   * La personalidad no copia directamente
   * el comportamiento de la comunidad.
   *
   * Cada tipo de interacción tiene una
   * influencia diferente.
   */

  return {
    affectionate: clamp(
      affection * 100,
    ),

    playful: clamp(
      play * 100 +
      affection * 10,
    ),

    mischievous: clamp(
      play * 70 +
      (1 - care) * 30,
    ),

    curious: clamp(
      play * 45 +
      care * 25 +
      affection * 10,
    ),
  };
}

export function evolvePersonalityFromCommunity(
  personality: NubiPersonality,
  community: NubiCommunity,
  strength = 0.04,
): NubiPersonality {
  const influence =
    calculateCommunityInfluence(community);

  const safeStrength = Math.max(
    0,
    Math.min(1, strength),
  );

  return {
    curiosity: clamp(
      personality.curiosity +
        (influence.curious -
          personality.curiosity) *
          safeStrength,
    ),

    playful: clamp(
      personality.playful +
        (influence.playful -
          personality.playful) *
          safeStrength,
    ),

    affectionate: clamp(
      personality.affectionate +
        (influence.affectionate -
          personality.affectionate) *
          safeStrength,
    ),

    mischievous: clamp(
      personality.mischievous +
        (influence.mischievous -
          personality.mischievous) *
          safeStrength,
    ),
  };
}
