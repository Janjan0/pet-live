const MAX_LEVEL = 100;

const BASE_XP = 100;
const LINEAR_GROWTH = 14;
const QUADRATIC_GROWTH = 1.4;

export function getXpForLevel(level: number): number {
  const safeLevel = Math.max(
    1,
    Math.min(MAX_LEVEL, Math.floor(level)),
  );

  if (safeLevel === 1) {
    return 0;
  }

  const n = safeLevel - 1;

  return Math.floor(
    BASE_XP * n +
    LINEAR_GROWTH * n * n +
    QUADRATIC_GROWTH * n * n * n / 10,
  );
}

export function getLevelFromExperience(
  experience: number,
): number {
  const safeExperience = Math.max(
    0,
    Math.floor(experience),
  );

  let level = 1;

  while (
    level < MAX_LEVEL &&
    safeExperience >= getXpForLevel(level + 1)
  ) {
    level += 1;
  }

  return level;
}

export function getXpRequiredForLevel(
  level: number,
): number {
  return getXpForLevel(level);
}

export function getXpToNextLevel(
  experience: number,
): number {
  const safeExperience = Math.max(
    0,
    Math.floor(experience),
  );

  const level =
    getLevelFromExperience(
      safeExperience,
    );

  if (level >= MAX_LEVEL) {
    return 0;
  }

  return Math.max(
    0,
    getXpForLevel(level + 1) -
      safeExperience,
  );
}

/*
 * La personalidad se vuelve progresivamente
 * más estable conforme Nubi madura.
 *
 * Nunca llega a cero:
 * un Nubi veterano siempre puede cambiar.
 */
export function getPersonalityEvolutionStrength(
  level: number,
): number {
  const safeLevel = Math.max(
    1,
    Math.floor(level),
  );

  const strength =
    0.06 /
    Math.pow(
      1 + safeLevel / 10,
      0.55,
    );

  return Math.max(
    0.012,
    Math.min(0.06, strength),
  );
}
