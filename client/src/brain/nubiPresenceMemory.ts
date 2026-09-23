import type { NubiSocialPerson } from "./nubiSocialMemory";

export type NubiPresenceStatus =
  | "present"
  | "recently_absent"
  | "long_absent";

export type NubiPresenceChange =
  | "none"
  | "returned"
  | "became_absent"
  | "became_long_absent";

export type NubiPresenceRecord = {
  viewerId: string;
  user: string;
  status: NubiPresenceStatus;
  lastSeen: number;
  absenceStartedAt: number | null;
  absenceDuration: number;
};

export type NubiPresenceMemory = {
  viewers: NubiPresenceRecord[];
};

const PRESENT_WINDOW =
  5 * 60 * 1000;

const LONG_ABSENCE_WINDOW =
  60 * 60 * 1000;

export function getPresenceStatus(
  lastSeen: number,
  now = Date.now(),
): NubiPresenceStatus {
  const elapsed =
    Math.max(0, now - lastSeen);

  if (elapsed < PRESENT_WINDOW) {
    return "present";
  }

  if (elapsed < LONG_ABSENCE_WINDOW) {
    return "recently_absent";
  }

  return "long_absent";
}

export function buildNubiPresenceMemory(
  people: NubiSocialPerson[],
  now = Date.now(),
): NubiPresenceMemory {
  return {
    viewers: people.map((person) => {
      const status =
        getPresenceStatus(
          person.lastSeen,
          now,
        );

      const absenceStartedAt =
        status === "present"
          ? null
          : person.lastSeen;

      return {
        viewerId: person.viewerId,
        user: person.user,
        status,
        lastSeen: person.lastSeen,
        absenceStartedAt,
        absenceDuration:
          Math.max(
            0,
            now - person.lastSeen,
          ),
      };
    }),
  };
}

export function getPresenceRecord(
  memory: NubiPresenceMemory,
  viewerId: string,
): NubiPresenceRecord | null {
  return (
    memory.viewers.find(
      (viewer) =>
        viewer.viewerId === viewerId,
    ) ?? null
  );
}

export function describeAbsence(
  duration: number,
): string {
  const minutes = Math.floor(
    duration / 60_000,
  );

  if (minutes < 60) {
    return `${minutes} minuto${
      minutes === 1 ? "" : "s"
    }`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours} hora${
      hours === 1 ? "" : "s"
    }`;
  }

  const days = Math.floor(
    hours / 24,
  );

  return `${days} día${
    days === 1 ? "" : "s"
  }`;
}

export function createReturnMessage(
  person: NubiSocialPerson,
  absenceDuration: number,
): string {
  const absence =
    describeAbsence(
      absenceDuration,
    );

  if (person.familiarity === "close") {
    return `🥹 ¡${person.user}! Nubi notó que te fuiste por ${absence}.`;
  }

  if (
    person.familiarity === "trusted"
  ) {
    return `🐾 ¡${person.user} volvió! Nubi notó tu ausencia.`;
  }

  if (
    person.familiarity === "familiar"
  ) {
    return `👀 ¡${person.user} volvió al LIVE!`;
  }

  return `🐾 ¡Hola de nuevo, ${person.user}!`;
}
