import type { ChatAction } from "../chat/interpreter";
import type { PetId } from "../world/petTypes";

export type ViewerInventoryItem = {
  id: string;
  quantity: number;
};

export type ViewerIdentity = {
  viewerId: string;
  username: string;
  displayName: string;
};

export type ViewerProfile = {
  /*
   * Identidad.
   *
   * viewerId = identidad estable.
   *
   * En desarrollo se genera a partir del nombre.
   * En el LIVE real TikTok proporcionará el ID
   * único del usuario.
   *
   * username = identificador visible (@usuario).
   * displayName = nombre que Nubi utiliza al hablar.
   *
   * IMPORTANTE:
   * Las relaciones y memorias deben usar viewerId.
   */
  viewerId: string;
  username: string;
  displayName: string;

  /*
   * Compatibilidad temporal.
   *
   * user conserva el nombre utilizado por el
   * sistema anterior mientras migramos el resto
   * de los módulos.
   */
  user: string;

  firstSeen: number;
  lastSeen: number;

  /*
   * true cuando el viewer ya ha entrado
   * realmente al LIVE al menos una vez.
   *
   * La identidad se determina por viewerId,
   * no por nombre ni username.
   */
  hasEnteredLive: boolean;

  totalInteractions: number;
  affection: number;
  care: number;
  play: number;
  gifts: number;

  favoriteAction: ChatAction | null;
  actionUsage: Partial<Record<ChatAction, number>>;
  supportedPetId: PetId | null;

  bond: number;

  /*
   * Economía de Nubi.
   */
  coins: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;

  inventory: ViewerInventoryItem[];
};

export type ViewerActionResult = {
  profile: ViewerProfile;
  isNewViewer: boolean;
};

function normalizeUser(user: string): string {
  return user.trim().toLowerCase();
}

function createViewerId(user: string): string {
  const normalized = normalizeUser(user);

  return (
    normalized
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) ||
    "espectador"
  );
}

function calculateBond(profile: ViewerProfile): number {
  const score =
    profile.totalInteractions * 0.5 +
    profile.affection * 3 +
    profile.care * 1.5 +
    profile.play * 1.5 +
    profile.gifts * 4;

  return Math.min(100, Math.round(score));
}

function isAffectionAction(action: ChatAction): boolean {
  return (
    action === "pet" ||
    action === "hug" ||
    action === "kiss" ||
    action === "comfort"
  );
}

function isCareAction(action: ChatAction): boolean {
  return (
    action === "feed" ||
    action === "drink" ||
    action === "bath" ||
    action === "toilet" ||
    action === "sleep"
  );
}

function isPlayAction(action: ChatAction): boolean {
  return (
    action === "play" ||
    action === "dance" ||
    action === "tease"
  );
}

export function createViewerProfile(
  identity: ViewerIdentity | string,
  petId: PetId,
  now = Date.now(),
): ViewerProfile {
  const resolvedIdentity: ViewerIdentity =
    typeof identity === "string"
      ? {
          viewerId: createViewerId(
            identity.trim() || "Espectador",
          ),
          username:
            identity.trim() || "Espectador",
          displayName:
            identity.trim() || "Espectador",
        }
      : {
          viewerId:
            identity.viewerId.trim() ||
            createViewerId(
              identity.username ||
                identity.displayName ||
                "Espectador",
            ),
          username:
            identity.username.trim() ||
            identity.displayName.trim() ||
            "Espectador",
          displayName:
            identity.displayName.trim() ||
            identity.username.trim() ||
            "Espectador",
        };

  const cleanUser =
    resolvedIdentity.displayName ||
    resolvedIdentity.username ||
    "Espectador";

  return {
    viewerId: resolvedIdentity.viewerId,
    username: resolvedIdentity.username,
    displayName: resolvedIdentity.displayName,
    user: cleanUser,

    firstSeen: now,
    lastSeen: now,
    hasEnteredLive: false,

    totalInteractions: 0,
    affection: 0,
    care: 0,
    play: 0,
    gifts: 0,

    favoriteAction: null,
    actionUsage: {},
    supportedPetId: petId,

    bond: 0,

    coins: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,

    inventory: [],
  };
}

export function registerViewerInteraction(
  profiles: ViewerProfile[],
  identity: ViewerIdentity | string,
  petId: PetId,
  action: ChatAction,
  now = Date.now(),
  gift = false,
): ViewerActionResult {
  const resolvedIdentity: ViewerIdentity =
    typeof identity === "string"
      ? {
          viewerId: createViewerId(
            identity.trim() || "Espectador",
          ),
          username:
            identity.trim() || "Espectador",
          displayName:
            identity.trim() || "Espectador",
        }
      : identity;

  const existing =
    profiles.find(
      (profile) =>
        profile.viewerId ===
        resolvedIdentity.viewerId,
    );

  if (!existing) {
    const profile =
      createViewerProfile(
        resolvedIdentity,
        petId,
        now,
      );

    profile.totalInteractions = 1;
    profile.affection =
      isAffectionAction(action) ? 1 : 0;
    profile.care =
      isCareAction(action) ? 1 : 0;
    profile.play =
      isPlayAction(action) ? 1 : 0;
    profile.gifts =
      gift ? 1 : 0;
    profile.favoriteAction = action;
    profile.actionUsage = { [action]: 1 };
    profile.bond =
      calculateBond(profile);

    return {
      profile,
      isNewViewer: true,
    };
  }

  /*
   * Compatibilidad con perfiles antiguos
   * creados antes de existir la economía.
   */
  const existingInventory =
    Array.isArray(existing.inventory)
      ? existing.inventory
      : [];

  const existingActionUsage =
    existing.actionUsage &&
    typeof existing.actionUsage === "object"
      ? existing.actionUsage
      : {};

  const actionUsage = {
    ...existingActionUsage,
    [action]:
      (existingActionUsage[action] ?? 0) + 1,
  };

  const updated: ViewerProfile = {
    ...existing,

    viewerId:
      existing.viewerId ||
      resolvedIdentity.viewerId ||
      createViewerId(existing.user),

    username:
      resolvedIdentity.username ||
      existing.username ||
      existing.user,

    displayName:
      resolvedIdentity.displayName ||
      existing.displayName ||
      existing.user,

    user:
      resolvedIdentity.displayName ||
      resolvedIdentity.username ||
      existing.user ||
      "Espectador",

    lastSeen: now,

    totalInteractions:
      existing.totalInteractions + 1,

    affection:
      existing.affection +
      (isAffectionAction(action) ? 1 : 0),

    care:
      existing.care +
      (isCareAction(action) ? 1 : 0),

    play:
      existing.play +
      (isPlayAction(action) ? 1 : 0),

    gifts:
      existing.gifts +
      (gift ? 1 : 0),

    supportedPetId:
      existing.supportedPetId ?? petId,

    actionUsage,

    favoriteAction:
      (Object.entries(actionUsage) as [
        ChatAction,
        number,
      ][]).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] ?? action,

    coins:
      typeof existing.coins === "number"
        ? existing.coins
        : 0,

    totalCoinsEarned:
      typeof existing.totalCoinsEarned === "number"
        ? existing.totalCoinsEarned
        : 0,

    totalCoinsSpent:
      typeof existing.totalCoinsSpent === "number"
        ? existing.totalCoinsSpent
        : 0,

    inventory: existingInventory,
  };

  updated.bond =
    calculateBond(updated);

  return {
    profile: updated,
    isNewViewer: false,
  };
}

export type ViewerJoinResult = {
  profile: ViewerProfile;
  isFirstLiveEntry: boolean;
  absenceDuration: number;
};

export function registerViewerJoin(
  profiles: ViewerProfile[],
  identity: ViewerIdentity | string,
  petId: PetId,
  now = Date.now(),
): ViewerJoinResult {
  const resolvedIdentity: ViewerIdentity =
    typeof identity === "string"
      ? {
          viewerId: createViewerId(
            identity.trim() || "Espectador",
          ),
          username:
            identity.trim() || "Espectador",
          displayName:
            identity.trim() || "Espectador",
        }
      : {
          viewerId:
            identity.viewerId.trim() ||
            createViewerId(
              identity.username ||
                identity.displayName ||
                "Espectador",
            ),
          username:
            identity.username.trim() ||
            identity.displayName.trim() ||
            "Espectador",
          displayName:
            identity.displayName.trim() ||
            identity.username.trim() ||
            "Espectador",
        };

  /*
   * La búsqueda SIEMPRE utiliza viewerId.
   *
   * Cambiar username o displayName no crea
   * un viewer nuevo mientras el viewerId sea el mismo.
   */
  const existing =
    profiles.find(
      (profile) =>
        profile.viewerId ===
        resolvedIdentity.viewerId,
    );

  /*
   * Primera entrada real al LIVE.
   */
  if (!existing) {
    const profile =
      createViewerProfile(
        resolvedIdentity,
        petId,
        now,
      );

    profile.hasEnteredLive = true;

    return {
      profile,
      isFirstLiveEntry: true,
      absenceDuration: 0,
    };
  }

  /*
   * Compatibilidad con perfiles creados antes
   * de existir hasEnteredLive.
   */
  const hasEnteredLive =
    existing.hasEnteredLive === true;

  const absenceDuration =
    Math.max(
      0,
      now - existing.lastSeen,
    );

  const updated: ViewerProfile = {
    ...existing,

    viewerId:
      existing.viewerId ||
      resolvedIdentity.viewerId,

    username:
      resolvedIdentity.username ||
      existing.username ||
      existing.user,

    displayName:
      resolvedIdentity.displayName ||
      existing.displayName ||
      existing.user,

    user:
      resolvedIdentity.displayName ||
      resolvedIdentity.username ||
      existing.user ||
      "Espectador",

    lastSeen: now,

    hasEnteredLive: true,

    inventory:
      Array.isArray(existing.inventory)
        ? existing.inventory
        : [],

    actionUsage:
      existing.actionUsage &&
      typeof existing.actionUsage === "object"
        ? existing.actionUsage
        : {},
  };

  return {
    profile: updated,
    isFirstLiveEntry: !hasEnteredLive,
    absenceDuration,
  };
}

export function upsertViewerProfile(
  profiles: ViewerProfile[],
  result: ViewerActionResult,
): ViewerProfile[] {
  const next =
    profiles.filter(
      (profile) =>
        profile.viewerId !==
        result.profile.viewerId,
    );

  next.push(result.profile);

  return next.sort(
    (a, b) =>
      b.lastSeen - a.lastSeen,
  );
}

export function findViewerProfile(
  profiles: ViewerProfile[],
  identity: ViewerIdentity | string,
): ViewerProfile | null {
  const viewerId =
    typeof identity === "string"
      ? createViewerId(identity)
      : identity.viewerId;

  return (
    profiles.find(
      (profile) =>
        profile.viewerId === viewerId,
    ) ?? null
  );
}

/*
 * Economía
 */

export function addViewerCoins(
  profile: ViewerProfile,
  amount: number,
): ViewerProfile {
  const safeAmount =
    Math.max(0, Math.floor(amount));

  if (safeAmount <= 0) {
    return profile;
  }

  return {
    ...profile,
    coins:
      profile.coins + safeAmount,
    totalCoinsEarned:
      profile.totalCoinsEarned +
      safeAmount,
  };
}

export function spendViewerCoins(
  profile: ViewerProfile,
  amount: number,
): ViewerProfile | null {
  const safeAmount =
    Math.max(0, Math.floor(amount));

  if (
    safeAmount <= 0 ||
    profile.coins < safeAmount
  ) {
    return null;
  }

  return {
    ...profile,
    coins:
      profile.coins - safeAmount,
    totalCoinsSpent:
      profile.totalCoinsSpent +
      safeAmount,
  };
}

export function addViewerInventoryItem(
  profile: ViewerProfile,
  itemId: string,
  quantity = 1,
): ViewerProfile {
  const cleanId = itemId.trim();
  const safeQuantity =
    Math.max(1, Math.floor(quantity));

  if (!cleanId) {
    return profile;
  }

  const existingIndex =
    profile.inventory.findIndex(
      (item) => item.id === cleanId,
    );

  if (existingIndex < 0) {
    return {
      ...profile,
      inventory: [
        ...profile.inventory,
        {
          id: cleanId,
          quantity: safeQuantity,
        },
      ],
    };
  }

  return {
    ...profile,
    inventory:
      profile.inventory.map(
        (item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity:
                  item.quantity +
                  safeQuantity,
              }
            : item,
      ),
  };
}
