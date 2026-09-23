export type Currency = "coins";

export type Wallet = {
  coins: number;
};

export type GiftType =
  | "food"
  | "affection"
  | "toy"
  | "clothing"
  | "accessory"
  | "currency"
  | "special";

export type GiftDefinition = {
  id: string;
  name: string;
  type: GiftType;

  /**
   * Valor interno del regalo.
   * No representa directamente dinero real.
   */
  coinValue: number;

  /**
   * Puede desbloquear o entregar un objeto.
   */
  itemId?: string;

  happiness?: number;
  love?: number;
  energy?: number;
};

export type GiftTransaction = {
  id: string;
  giftId: string;
  fromUser: string;
  petId: string;
  timestamp: number;
};

/**
 * Evento de regalo recibido desde una fuente externa.
 *
 * En desarrollo puede venir del simulador.
 * Más adelante podrá representar un evento real
 * procedente de TikTok u otra plataforma.
 */
export type GiftEvent = {
  eventId: string;

  giftId: string;

  viewerId: string;
  user: string;

  petId: string;

  timestamp: number;
};
