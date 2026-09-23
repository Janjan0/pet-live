import type { GiftDefinition } from "./types";

export const GIFT_CATALOG: GiftDefinition[] = [
  {
    id: "apple",
    name: "Manzana",
    type: "food",
    coinValue: 5,
    happiness: 2,
  },
  {
    id: "heart",
    name: "Corazón",
    type: "affection",
    coinValue: 10,
    love: 5,
    happiness: 3,
  },
  {
    id: "teddy",
    name: "Peluche",
    type: "toy",
    coinValue: 25,
    itemId: "teddy-bear",
    happiness: 6,
    love: 4,
  },
  {
    id: "blue-shirt",
    name: "Camiseta Azul",
    type: "clothing",
    coinValue: 40,
    itemId: "shirt-blue",
    happiness: 2,
  },
  {
    id: "star-cap",
    name: "Gorra Estrella",
    type: "accessory",
    coinValue: 75,
    itemId: "cap-star",
    happiness: 3,
  },
  {
    id: "gold-crown",
    name: "Corona Dorada",
    type: "special",
    coinValue: 500,
    itemId: "crown-gold",
    happiness: 5,
    love: 3,
  },
];
