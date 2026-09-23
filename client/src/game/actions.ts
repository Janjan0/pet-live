import type { ChatAction } from "../chat/interpreter";

export type PetActionResult = {
  hunger?: number;
  thirst?: number;
  happiness?: number;
  energy?: number;
  health?: number;
  experience?: number;
  love?: number;
  social?: number;
  hygiene?: number;
  bathroom?: number;
};

const clamp = (value: number) =>
  Math.max(0, Math.min(100, value));

export function applyChatAction(
  action: ChatAction,
): PetActionResult {
  switch (action) {
    case "feed":
      return {
        hunger: 10,
        happiness: 2,
        health: 1,
        experience: 3,
        social: 1,
      };

    case "drink":
      return {
        thirst: 10,
        happiness: 2,
        health: 1,
        experience: 2,
        social: 1,
      };

    case "pet":
      return {
        happiness: 3,
        love: 3,
        experience: 2,
        social: 1,
      };

    case "hug":
      return {
        happiness: 4,
        love: 5,
        experience: 3,
        social: 2,
      };

    case "kiss":
      return {
        happiness: 3,
        love: 5,
        experience: 3,
        social: 1,
      };

    case "play":
      return {
        hunger: -4,
        thirst: -3,
        happiness: 7,
        energy: -5,
        hygiene: -2,
        love: 2,
        experience: 4,
        social: 2,
      };

    case "dance":
      return {
        hunger: -3,
        thirst: -3,
        happiness: 6,
        energy: -5,
        hygiene: -2,
        experience: 4,
        social: 2,
      };

    case "sleep":
      return {
        energy: 12,
        health: 2,
        experience: 2,
      };

    case "wake":
      return {
        happiness: 2,
        social: 1,
        experience: 1,
      };

    case "bath":
      return {
        happiness: 3,
        health: 4,
        hygiene: 25,
        experience: 2,
      };

    case "toilet":
      return {
        happiness: 2,
        health: 2,
        bathroom: -35,
        experience: 2,
      };

    case "greet":
      return {
        happiness: 2,
        social: 2,
        experience: 1,
      };

    case "laugh":
      return {
        happiness: 3,
        social: 2,
        experience: 1,
      };

    case "comfort":
      return {
        happiness: 4,
        love: 4,
        social: 2,
        experience: 2,
      };

    case "tease":
      return {
        happiness: 1,
        social: 2,
        experience: 1,
      };

    default:
      return {};
  }
}

export function changeStat(
  value: number,
  change: number,
): number {
  return clamp(value + change);
}
