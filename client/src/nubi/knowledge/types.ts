export type KnowledgeCategory =
  | "word"
  | "slang"
  | "person"
  | "object"
  | "place"
  | "concept"
  | "expression"
  | "meme"
  | "fact"
  | "other";

export type KnowledgeSource = {
  user: string;
  timestamp: number;
  confidence: number;
};

export type NubiKnowledge = {
  id: string;
  term: string;
  meaning: string;
  category: KnowledgeCategory;

  confidence: number;

  timesConfirmed: number;
  timesContradicted: number;

  sources: KnowledgeSource[];

  firstLearnedAt: number;
  lastConfirmedAt: number;

  learnedFrom: string | null;
};

export type KnowledgeQueryResult = {
  found: boolean;
  knowledge: NubiKnowledge | null;
  confidence: number;
};

export type LearningResult = {
  learned: boolean;
  updated: boolean;
  knowledge: NubiKnowledge;
  reason:
    | "new"
    | "confirmed"
    | "strengthened"
    | "contradicted"
    | "rejected";
};
