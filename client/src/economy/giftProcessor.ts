import type { PetState } from "../brain/nubiState";
import { addItem } from "../inventory/inventory";
import {
  addViewerCoins,
  addViewerInventoryItem,
  registerViewerInteraction,
} from "../viewer/viewerSystem";
import type { ViewerProfile } from "../viewer/viewerSystem";
import {
  createTransactionId,
  hasProcessedEvent,
  markEventProcessed,
  type EconomyTransaction,
} from "./transactions";
import { GIFT_CATALOG } from "./gifts";
import type {
  GiftDefinition,
  GiftEvent,
  GiftTransaction,
} from "./types";

export type GiftResult = {
  accepted: boolean;
  pet: PetState;
  gift: GiftDefinition | null;
  transaction: GiftTransaction | null;
  message: string;
};

export function processGift(
  pet: PetState,
  giftId: string,
  fromUser: string,
  now = Date.now(),
): GiftResult {
  const gift = GIFT_CATALOG.find(
    (candidate) => candidate.id === giftId,
  );

  if (!gift) {
    return {
      accepted: false,
      pet,
      gift: null,
      transaction: null,
      message: "Ese regalo no existe.",
    };
  }

  let updatedPet: PetState = {
    ...pet,
    happiness: Math.min(
      100,
      pet.happiness + (gift.happiness ?? 0),
    ),
    love: Math.min(
      100,
      pet.love + (gift.love ?? 0),
    ),
    energy: Math.min(
      100,
      pet.energy + (gift.energy ?? 0),
    ),
  };

  if (gift.itemId) {
    const inventory = addItem(
      updatedPet.inventory,
      gift.itemId,
    );

    updatedPet = {
      ...updatedPet,
      inventory,
    };
  }

  const transaction: GiftTransaction = {
    id: `gift-${now}-${Math.random().toString(36).slice(2, 8)}`,
    giftId: gift.id,
    fromUser,
    petId: pet.id,
    timestamp: now,
  };

  return {
    accepted: true,
    pet: updatedPet,
    gift,
    transaction,
    message: `${pet.name} recibió ${gift.name} de @${fromUser}.`,
  };
}

export type ProcessViewerGiftResult = {
  accepted: boolean;
  duplicate: boolean;
  pet: PetState;
  viewer: ViewerProfile;
  gift: GiftDefinition | null;
  transaction: EconomyTransaction | null;
  message: string;
};

/**
 * Procesa un regalo que afecta tanto a Nubi como al espectador.
 *
 * El eventId funciona como identificador idempotente:
 * el mismo evento no puede entregar las recompensas dos veces.
 */
export function processViewerGift(
  pet: PetState,
  viewer: ViewerProfile,
  event: GiftEvent,
  now = Date.now(),
): ProcessViewerGiftResult {
  if (hasProcessedEvent(event.eventId)) {
    return {
      accepted: false,
      duplicate: true,
      pet,
      viewer,
      gift: null,
      transaction: null,
      message: "Ese regalo ya fue procesado.",
    };
  }

  if (
    event.petId !== pet.id ||
    event.viewerId !== viewer.viewerId
  ) {
    return {
      accepted: false,
      duplicate: false,
      pet,
      viewer,
      gift: null,
      transaction: null,
      message: "El evento de regalo no coincide con el espectador o Nubi.",
    };
  }

  const gift = GIFT_CATALOG.find(
    (candidate) => candidate.id === event.giftId,
  );

  if (!gift) {
    return {
      accepted: false,
      duplicate: false,
      pet,
      viewer,
      gift: null,
      transaction: null,
      message: "Ese regalo no existe.",
    };
  }

  const giftResult = processGift(
    pet,
    gift.id,
    event.user,
    event.timestamp,
  );

  if (!giftResult.accepted || !giftResult.gift) {
    return {
      accepted: false,
      duplicate: false,
      pet,
      viewer,
      gift: null,
      transaction: null,
      message: giftResult.message,
    };
  }

  let updatedViewer = registerViewerInteraction(
    [viewer],
    {
      viewerId: viewer.viewerId,
      username: viewer.username,
      displayName: viewer.displayName,
    },
    pet.id,
    "greet",
    event.timestamp,
    false,
  ).profile;

  updatedViewer = {
    ...updatedViewer,
    gifts: updatedViewer.gifts + 1,
    bond: Math.min(100, updatedViewer.bond + 2),
  };

  updatedViewer = addViewerCoins(
    updatedViewer,
    gift.coinValue,
  );

  if (gift.itemId) {
    updatedViewer = addViewerInventoryItem(
      updatedViewer,
      gift.itemId,
    );
  }

  const transaction: EconomyTransaction = {
    id: createTransactionId("gift"),
    eventId: event.eventId,
    type: "gift_reward",
    viewerId: updatedViewer.viewerId,
    user: updatedViewer.user,
    amount: gift.coinValue,
    giftId: gift.id,
    itemId: gift.itemId,
    timestamp: now,
  };

  markEventProcessed(event.eventId);

  return {
    accepted: true,
    duplicate: false,
    pet: giftResult.pet,
    viewer: updatedViewer,
    gift,
    transaction,
    message: `${pet.name} recibió ${gift.name} de @${event.user}. +${gift.coinValue} 🪙`,
  };
}
