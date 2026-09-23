import { getItem } from "./inventory";
import type { PetInventory } from "./types";

export function calculateStyle(
  inventory: PetInventory,
): number {
  let style = 0;

  for (const itemId of inventory.equipped) {
    const item = getItem(itemId);

    if (!item) continue;

    style += item.style ?? 0;
  }

  return Math.min(100, style);
}
