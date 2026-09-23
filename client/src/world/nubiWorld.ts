import {
  createInitialPetState,
  type PetState,
} from "../brain/nubiState";

import {
  createCommunity,
  type NubiCommunity,
} from "./community";

import type { PetId } from "./petTypes";

import type { ViewerProfile } from "../viewer/viewerSystem";

export type NubiSide = "A" | "B";

export type NubiWorld = {
  pets: Record<PetId, PetState>;

  communities: Record<
    PetId,
    NubiCommunity
  >;

  viewers: Record<
    PetId,
    ViewerProfile[]
  >;

  sides: Record<NubiSide, PetId>;
};

export function createInitialNubiWorld(): NubiWorld {
  const nubiA = createInitialPetState({
    id: "nubi-a",
    name: "Nubi",
  });

  const nubiB = createInitialPetState({
    id: "nubi-b",
    name: "Nubi",
  });

  return {
    pets: {
      [nubiA.id]: nubiA,
      [nubiB.id]: nubiB,
    },

    communities: {
      [nubiA.id]: createCommunity(nubiA.id),
      [nubiB.id]: createCommunity(nubiB.id),
    },

    viewers: {
      [nubiA.id]: [],
      [nubiB.id]: [],
    },

    sides: {
      A: nubiA.id,
      B: nubiB.id,
    },
  };
}

export const initialNubiWorld =
  createInitialNubiWorld();
