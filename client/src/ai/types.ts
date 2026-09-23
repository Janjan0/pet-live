
import type { ChatAction } from "../chat/interpreter";

export type AISentiment =
  | "positive"
  | "negative"
  | "neutral"
  | "playful";

export type AIInterpretation = {
  action: ChatAction;
  confidence: number;
  reason?: string;
  sentiment: AISentiment;
  addressedToNubi: boolean;
};

export type AIContext = {
  petId: string;
  petName: string;
  comment: string;
  user: string;
  hunger: number;
  thirst: number;
  energy: number;
  happiness: number;
  health: number;
  love: number;
  social: number;
  personality: {
    curiosity: number;
    playful: number;
    affectionate: number;
    mischievous: number;
  };
};
