import type { PetId } from "../world/petTypes";

export type BattleStatus =
  | "waiting"
  | "active"
  | "finished";

export type BattleMode = "command";

export type BattleScore = {
  happiness: number;
  style: number;
  affection: number;
  care: number;
  community: number;
  gifts: number;
  total: number;
};

export type BattleParticipant = {
  petId: PetId;
  score: BattleScore;
};

export type BattleSession = {
  id: string;
  mode: BattleMode;
  status: BattleStatus;

  participantA: BattleParticipant;
  participantB: BattleParticipant;

  startedAt: number;
  finishedAt: number | null;
};
