import {
  addViewerInventoryItem,
  spendViewerCoins,
} from "../viewer/viewerSystem";
import type { ViewerProfile } from "../viewer/viewerSystem";
import {
  createTransactionId,
  hasProcessedEvent,
  markEventProcessed,
  type EconomyTransaction,
} from "./transactions";
import { GIFT_CATALOG } from "./gifts";
import type { GiftDefinition } from "./types";

export type PurchaseResult = {
  accepted: boolean;
  duplicate: boolean;
  viewer: ViewerProfile;
  gift: GiftDefinition | null;
  transaction: EconomyTransaction | null;
  message: string;
};

export function purchaseGift(
  viewer: ViewerProfile,
  giftId: string,
  eventId: string,
  now = Date.now(),
): PurchaseResult {
  if (!eventId.trim()) {
    return {
      accepted: false,
      duplicate: false,
      viewer,
      gift: null,
      transaction: null,
      message: "La compra no tiene un identificador válido.",
    };
  }

  if (hasProcessedEvent(eventId)) {
    return {
      accepted: false,
      duplicate: true,
      viewer,
      gift: null,
      transaction: null,
      message: "Esta compra ya fue procesada.",
    };
  }

  const gift = GIFT_CATALOG.find(
    (candidate) => candidate.id === giftId,
  );

  if (!gift) {
    return {
      accepted: false,
      duplicate: false,
      viewer,
      gift: null,
      transaction: null,
      message: "Ese objeto no está disponible en la tienda.",
    };
  }

  if (!Number.isFinite(gift.coinValue) || gift.coinValue <= 0) {
    return {
      accepted: false,
      duplicate: false,
      viewer,
      gift,
      transaction: null,
      message: "Ese objeto no tiene un precio válido.",
    };
  }

  const updatedViewer = spendViewerCoins(
    viewer,
    gift.coinValue,
  );

  if (!updatedViewer) {
    return {
      accepted: false,
      duplicate: false,
      viewer,
      gift,
      transaction: null,
      message: `No tienes suficientes 🪙 para comprar ${gift.name}.`,
    };
  }

  const viewerWithItem = gift.itemId
    ? addViewerInventoryItem(
        updatedViewer,
        gift.itemId,
      )
    : updatedViewer;

  markEventProcessed(eventId);

  const transaction: EconomyTransaction = {
    id: createTransactionId("purchase"),
    eventId,
    type: "purchase",
    viewerId: viewerWithItem.viewerId,
    user: viewerWithItem.user,
    amount: gift.coinValue,
    giftId: gift.id,
    itemId: gift.itemId,
    timestamp: now,
  };

  return {
    accepted: true,
    duplicate: false,
    viewer: viewerWithItem,
    gift,
    transaction,
    message: `🛒 @${viewerWithItem.user} compró ${gift.name} por ${gift.coinValue} 🪙.`,
  };
}
