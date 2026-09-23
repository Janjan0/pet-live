import { ITEM_CATALOG } from "./catalog";
import type { PetAppearance, PetInventory } from "./types";

export function getItem(itemId: string) {
  return ITEM_CATALOG.find((item) => item.id === itemId) ?? null;
}

export function hasItem(
  inventory: PetInventory,
  itemId: string,
): boolean {
  return inventory.owned.some(
    (entry) => entry.itemId === itemId && entry.quantity > 0,
  );
}

export function addItem(
  inventory: PetInventory,
  itemId: string,
  quantity = 1,
): PetInventory {
  if (!getItem(itemId) || quantity <= 0) {
    return inventory;
  }

  const existing = inventory.owned.find(
    (entry) => entry.itemId === itemId,
  );

  if (existing) {
    return {
      ...inventory,
      owned: inventory.owned.map((entry) =>
        entry.itemId === itemId
          ? {
              ...entry,
              quantity: entry.quantity + quantity,
            }
          : entry,
      ),
    };
  }

  return {
    ...inventory,
    owned: [
      ...inventory.owned,
      {
        itemId,
        quantity,
      },
    ],
  };
}

export function equipItem(
  inventory: PetInventory,
  itemId: string,
): PetInventory {
  const item = getItem(itemId);

  if (!item || !hasItem(inventory, itemId)) {
    return inventory;
  }

  const sameCategory = ITEM_CATALOG
    .filter((candidate) => candidate.category === item.category)
    .map((candidate) => candidate.id);

  return {
    ...inventory,
    equipped: [
      ...inventory.equipped.filter(
        (id) => !sameCategory.includes(id),
      ),
      itemId,
    ],
  };
}

export function unequipItem(
  inventory: PetInventory,
  itemId: string,
): PetInventory {
  return {
    ...inventory,
    equipped: inventory.equipped.filter((id) => id !== itemId),
  };
}

export function buildAppearance(
  inventory: PetInventory,
): PetAppearance {
  const appearance: PetAppearance = {
    clothing: null,
    accessory: null,
    toy: null,
    special: null,
  };

  for (const itemId of inventory.equipped) {
    const item = getItem(itemId);

    if (!item) continue;

    if (item.category === "clothing") {
      appearance.clothing = itemId;
    }

    if (item.category === "accessory") {
      appearance.accessory = itemId;
    }

    if (item.category === "toy") {
      appearance.toy = itemId;
    }

    if (item.category === "special") {
      appearance.special = itemId;
    }
  }

  return appearance;
}
