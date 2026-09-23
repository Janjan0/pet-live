export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type ItemCategory =
  | "clothing"
  | "accessory"
  | "toy"
  | "food"
  | "decoration"
  | "special";

export type PetItem = {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;

  happiness?: number;
  style?: number;
  love?: number;
  energy?: number;

  tags?: string[];
};

export type InventoryEntry = {
  itemId: string;
  quantity: number;
};

export type PetInventory = {
  owned: InventoryEntry[];

  /**
   * Objetos que Nubi lleva puestos o tiene activos.
   * Un objeto por categoría visual cuando corresponda.
   */
  equipped: string[];
};

export type PetAppearance = {
  clothing: string | null;
  accessory: string | null;
  toy: string | null;
  special: string | null;
};
