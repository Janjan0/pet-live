import type { PetItem } from "./types";

export const ITEM_CATALOG: PetItem[] = [
  {
    id: "shirt-blue",
    name: "Camiseta Azul",
    category: "clothing",
    rarity: "common",
    style: 4,
    tags: ["shirt", "casual"],
  },
  {
    id: "hoodie-purple",
    name: "Hoodie Morado",
    category: "clothing",
    rarity: "uncommon",
    style: 8,
    happiness: 2,
    tags: ["hoodie", "casual"],
  },
  {
    id: "cap-star",
    name: "Gorra Estrella",
    category: "accessory",
    rarity: "rare",
    style: 12,
    happiness: 2,
    tags: ["cap", "star"],
  },
  {
    id: "crown-gold",
    name: "Corona Dorada",
    category: "accessory",
    rarity: "legendary",
    style: 25,
    happiness: 5,
    love: 3,
    tags: ["crown", "royal"],
  },
  {
    id: "teddy-bear",
    name: "Peluche",
    category: "toy",
    rarity: "common",
    happiness: 6,
    love: 3,
    tags: ["toy", "cute"],
  },
];
