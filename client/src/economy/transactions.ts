export type EconomyTransactionType =
  | "gift_reward"
  | "purchase"
  | "reward"
  | "refund";

export type EconomyTransaction = {
  id: string;
  eventId: string;
  type: EconomyTransactionType;

  viewerId: string;
  user: string;

  amount: number;

  giftId?: string;
  itemId?: string;

  timestamp: number;
};

const processedEventIds = new Set<string>();

export function createTransactionId(
  prefix = "txn",
  now = Date.now(),
): string {
  return `${prefix}-${now}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function createEventId(
  prefix = "event",
  now = Date.now(),
): string {
  return `${prefix}-${now}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * Comprueba si un evento ya fue procesado.
 *
 * Durante desarrollo vive en memoria.
 * Más adelante el servidor será la autoridad
 * y esta comprobación se hará contra almacenamiento
 * persistente / base de datos.
 */
export function hasProcessedEvent(
  eventId: string,
): boolean {
  return processedEventIds.has(eventId);
}

/**
 * Marca un evento como procesado.
 *
 * Devuelve false si ya existía.
 */
export function markEventProcessed(
  eventId: string,
): boolean {
  if (!eventId.trim()) {
    return false;
  }

  if (processedEventIds.has(eventId)) {
    return false;
  }

  processedEventIds.add(eventId);

  return true;
}

/**
 * Solo para pruebas/desarrollo.
 */
export function clearProcessedEvents(): void {
  processedEventIds.clear();
}
