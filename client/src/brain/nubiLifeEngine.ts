import type { NubiState, NubiIllness } from "./nubiState";

const clamp = (value: number) =>
  Math.max(0, Math.min(100, value));

const MINUTE = 60_000;

/*
 * Ritmo de vida de Nubi.
 *
 * Estos valores representan cuánto cambia cada necesidad
 * por cada minuto real transcurrido.
 *
 * Son deliberadamente lentos:
 * Nubi debe sentirse vivo, no estar muriéndose
 * mientras el espectador tarda unos minutos en volver.
 */
const RATES = {
  hunger: 0.8,
  thirst: 1.0,
  energy: 0.45,
  happiness: 0.18,
  hygiene: 0.35,
  bathroom: 0.55,
} as const;

function getIllness(
  state: NubiState,
  health: number,
  hygiene: number,
  bathroom: number,
): NubiIllness {
  const needsIgnored =
    state.hunger <= 8 ||
    state.thirst <= 8;

  const veryDirty = hygiene <= 12;

  if (
    health <= 45 ||
    (
      needsIgnored &&
      veryDirty
    )
  ) {
    return "sick";
  }

  if (
    health <= 75 ||
    state.hunger <= 20 ||
    state.thirst <= 20 ||
    hygiene <= 30 ||
    bathroom >= 80
  ) {
    return "unwell";
  }

  return "healthy";
}

export function advanceNubiLife(
  state: NubiState,
  now = Date.now(),
): NubiState {
  const lastTimestamp =
    state.lastLifeUpdate ?? now;

  const elapsed = Math.max(
    0,
    now - lastTimestamp,
  );

  /*
   * Evitamos aplicar cantidades absurdas si el navegador
   * estuvo suspendido durante muchísimo tiempo.
   *
   * Como máximo procesamos 12 horas de vida de golpe.
   */
  const effectiveElapsed = Math.min(
    elapsed,
    12 * 60 * MINUTE,
  );

  const minutes =
    effectiveElapsed / MINUTE;

  if (minutes <= 0) {
    return state;
  }

  let hunger =
    clamp(
      state.hunger -
        RATES.hunger * minutes,
    );

  let thirst =
    clamp(
      state.thirst -
        RATES.thirst * minutes,
    );

  let energy =
    clamp(
      state.energy -
        RATES.energy * minutes,
    );

  let happiness =
    clamp(
      state.happiness -
        RATES.happiness * minutes,
    );

  let hygiene =
    clamp(
      state.hygiene -
        RATES.hygiene * minutes,
    );

  let bathroom =
    clamp(
      state.bathroom +
        RATES.bathroom * minutes,
    );

  /*
   * Cuando las necesidades básicas están muy bajas,
   * Nubi empieza a sufrir.
   *
   * La pérdida de salud es lenta para evitar que el juego
   * castigue demasiado al espectador.
   */
  let health = state.health;

  const criticalNeeds =
    hunger <= 15 ||
    thirst <= 15;

  const neglected =
    hygiene <= 20 ||
    bathroom >= 90;

  if (criticalNeeds) {
    health -= 0.45 * minutes;
  }

  if (neglected) {
    health -= 0.25 * minutes;
  }

  /*
   * Si Nubi está realmente enfermo, también pierde un poco
   * de energía y felicidad mientras no reciba cuidados.
   */
  const preliminaryIllness =
    getIllness(
      {
        ...state,
        hunger,
        thirst,
        health,
        hygiene,
        bathroom,
      },
      health,
      hygiene,
      bathroom,
    );

  if (
    preliminaryIllness === "sick"
  ) {
    energy = clamp(
      energy - 0.15 * minutes,
    );

    happiness = clamp(
      happiness - 0.3 * minutes,
    );

    health -= 0.2 * minutes;
  }

  health = clamp(health);

  const illness =
    getIllness(
      {
        ...state,
        hunger,
        thirst,
        health,
        hygiene,
        bathroom,
      },
      health,
      hygiene,
      bathroom,
    );

  return {
    ...state,
    hunger,
    thirst,
    energy,
    happiness,
    health,
    hygiene,
    bathroom,
    illness,
    lastLifeUpdate: now,
  };
}
