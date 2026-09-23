import type { ChatAction } from "../../chat/interpreter";

export type SemanticSource = {
  user: string;
  timestamp: number;
  confidence: number;
};

export type SemanticMemoryStatus =
  | "learned"
  | "pending";

export type NubiSemanticMemory = {
  id: string;

  /*
   * "learned" = Nubi conoce la expresión.
   * "pending" = Nubi sabe que existe, pero todavía
   * no ha podido aprender su significado.
   */
  status: SemanticMemoryStatus;

  /*
   * Expresión que la comunidad utilizó.
   *
   * Ejemplo:
   * "ver brillar"
   */
  expression: string;

  /*
   * Qué significa según lo aprendido.
   */
  meaning: string;

  /*
   * Acción que Nubi puede ejecutar.
   *
   * null significa que conocemos el significado,
   * pero todavía no existe una acción compatible.
   */
  action: ChatAction | null;

  confidence: number;

  timesUsed: number;
  timesConfirmed: number;

  sources: SemanticSource[];

  firstLearnedAt: number;
  lastUsedAt: number;

  learnedFrom: string | null;
};

export type SemanticLookupResult = {
  found: boolean;
  memory: NubiSemanticMemory | null;
  confidence: number;
};
