import type { ViewerProfile } from "../viewer/viewerSystem";
import type { ChatAction } from "../chat/interpreter";

export type NubiSocialFamiliarity =
  | "stranger"
  | "known"
  | "familiar"
  | "trusted"
  | "close";

export type NubiSocialRole =
  | "caregiver"
  | "playmate"
  | "affectionate"
  | "companion"
  | "mixed";

export type NubiSocialPerson = {
  viewerId: string;
  user: string;

  familiarity: NubiSocialFamiliarity;
  bond: number;

  role: NubiSocialRole;
  pattern: string;

  actionUsage: Partial<Record<ChatAction, number>>;

  totalInteractions: number;
  affection: number;
  care: number;
  play: number;
  gifts: number;

  favoriteAction: ViewerProfile["favoriteAction"];

  lastSeen: number;
};

export type NubiSocialMemory = {
  people: NubiSocialPerson[];

  totalKnownPeople: number;
  totalInteractions: number;
  totalAffection: number;
  totalCare: number;
  totalPlay: number;
  totalGifts: number;

  closestPerson: NubiSocialPerson | null;
};

function getFamiliarity(
  profile: ViewerProfile,
): NubiSocialFamiliarity {
  if (profile.bond >= 80) {
    return "close";
  }

  if (profile.bond >= 60) {
    return "trusted";
  }

  if (profile.bond >= 35) {
    return "familiar";
  }

  if (profile.totalInteractions >= 2) {
    return "known";
  }

  return "stranger";
}

function getSocialRole(
  profile: ViewerProfile,
): NubiSocialRole {
  const usage =
    profile.actionUsage ?? {};

  const careActions: ChatAction[] = [
    "feed",
    "drink",
    "bath",
    "toilet",
    "sleep",
  ];

  const affectionActions: ChatAction[] = [
    "pet",
    "hug",
    "kiss",
    "comfort",
  ];

  const playActions: ChatAction[] = [
    "play",
    "dance",
    "tease",
  ];

  const sum = (actions: ChatAction[]) =>
    actions.reduce(
      (total, action) =>
        total + (usage[action] ?? 0),
      0,
    );

  const care = sum(careActions);
  const affection = sum(affectionActions);
  const play = sum(playActions);

  const total = care + affection + play;

  if (total === 0) {
    return "companion";
  }

  const highest = Math.max(
    care,
    affection,
    play,
  );

  const closeEnough = (value: number) =>
    value >= highest * 0.75;

  const dominantCount = [
    closeEnough(care),
    closeEnough(affection),
    closeEnough(play),
  ].filter(Boolean).length;

  if (dominantCount >= 2) {
    return "mixed";
  }

  if (highest === care) {
    return "caregiver";
  }

  if (highest === affection) {
    return "affectionate";
  }

  return "playmate";
}

function getSocialPattern(
  profile: ViewerProfile,
  role: NubiSocialRole,
): string {
  const usage =
    profile.actionUsage ?? {};

  const favorite =
    profile.favoriteAction;

  if (role === "caregiver") {
    return favorite
      ? `Suele cuidar a Nubi, especialmente con ${favorite}.`
      : "Suele cuidar a Nubi.";
  }

  if (role === "playmate") {
    return favorite
      ? `Suele divertirse con Nubi, especialmente con ${favorite}.`
      : "Suele jugar con Nubi.";
  }

  if (role === "affectionate") {
    return favorite
      ? `Suele demostrar cariño a Nubi, especialmente con ${favorite}.`
      : "Suele demostrar cariño a Nubi.";
  }

  if (role === "mixed") {
    return "Tiene una relación variada con Nubi y participa de distintas formas.";
  }

  if (Object.keys(usage).length > 0) {
    return "Nubi todavía está descubriendo cómo suele interactuar.";
  }

  return "Nubi todavía está conociendo a esta persona.";
}

function toSocialPerson(
  profile: ViewerProfile,
): NubiSocialPerson {
  const role =
    getSocialRole(profile);

  return {
    viewerId: profile.viewerId,
    user: profile.user,

    familiarity:
      getFamiliarity(profile),

    bond: profile.bond,

    role,

    pattern:
      getSocialPattern(
        profile,
        role,
      ),

    actionUsage:
      profile.actionUsage ?? {},


    totalInteractions:
      profile.totalInteractions,

    affection:
      profile.affection,

    care:
      profile.care,

    play:
      profile.play,

    gifts:
      profile.gifts,

    favoriteAction:
      profile.favoriteAction,

    lastSeen:
      profile.lastSeen,
  };
}

/**
 * Convierte los perfiles persistidos de espectadores
 * en el contexto social que Nubi puede utilizar.
 *
 * No modifica perfiles.
 * No guarda datos.
 * No crea una memoria paralela.
 */
export function buildNubiSocialMemory(
  profiles: ViewerProfile[],
): NubiSocialMemory {
  const people =
    profiles.map(toSocialPerson);

  const closestPerson =
    [...people]
      .sort(
        (a, b) =>
          b.bond - a.bond ||
          b.totalInteractions -
            a.totalInteractions,
      )[0] ?? null;

  return {
    people,

    totalKnownPeople:
      people.length,

    totalInteractions:
      people.reduce(
        (total, person) =>
          total +
          person.totalInteractions,
        0,
      ),

    totalAffection:
      people.reduce(
        (total, person) =>
          total +
          person.affection,
        0,
      ),

    totalCare:
      people.reduce(
        (total, person) =>
          total +
          person.care,
        0,
      ),

    totalPlay:
      people.reduce(
        (total, person) =>
          total +
          person.play,
        0,
      ),

    totalGifts:
      people.reduce(
        (total, person) =>
          total +
          person.gifts,
        0,
      ),

    closestPerson,
  };
}
