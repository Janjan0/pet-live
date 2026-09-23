import type { PetState } from "../brain/nubiState";
import {
  buildAppearance,
  equipItem,
  hasItem,
} from "./inventory";

export type EquipResult = {
  accepted: boolean;
  pet: PetState;
  message: string;
};

export function equipPetItem(
  pet: PetState,
  itemId: string,
): EquipResult {
  if (!hasItem(pet.inventory, itemId)) {
    return {
      accepted: false,
      pet,
      message: "Nubi todavía no tiene ese objeto.",
    };
  }

  const inventory = equipItem(
    pet.inventory,
    itemId,
  );

  return {
    accepted: true,

    pet: {
      ...pet,
      inventory,
      appearance: buildAppearance(inventory),
    },

    message: `${pet.name} ahora lleva puesto un nuevo objeto.`,
  };
}
