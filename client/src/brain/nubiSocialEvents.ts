import type { ChatAction } from "../chat/interpreter";

export type NubiSocialEventType =
  | "approach"
  | "play"
  | "affection"
  | "mischief"
  | "attention"
  | "presence";

export type NubiSocialEvent = {
  id: string;

  type: NubiSocialEventType;

  actor: "nubi";
  targetViewer: string;

  action: ChatAction | null;

  message: string;

  timestamp: number;
};

function createSocialEventId(): string {
  return `social-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getEventType(
  action: ChatAction,
): NubiSocialEventType {
  switch (action) {
    case "play":
    case "dance":
      return "play";

    case "pet":
    case "hug":
    case "kiss":
    case "comfort":
      return "affection";

    case "tease":
      return "mischief";

    case "greet":
      return "attention";

    default:
      return "attention";
  }
}

function createSocialMessage(
  action: ChatAction,
  targetViewer: string,
): string {
  switch (action) {
    case "play":
      return `🐾 Nubi quiere jugar con ${targetViewer}`;

    case "dance":
      return `💃 Nubi quiere bailar con ${targetViewer}`;

    case "pet":
      return `🐾 Nubi se acerca a ${targetViewer} para recibir mimos`;

    case "hug":
      return `💕 Nubi busca un abrazo de ${targetViewer}`;

    case "kiss":
      return `🥰 Nubi se acerca a ${targetViewer} buscando un besito`;

    case "comfort":
      return `❤️ Nubi busca un poquito de cariño de ${targetViewer}`;

    case "tease":
      return `😏 Nubi está preparando una travesura para ${targetViewer}`;

    case "greet":
      return `👀 Nubi quiere saludar a ${targetViewer}`;

    default:
      return `🐾 Nubi está pendiente de ${targetViewer}`;
  }
}

export function createNubiSocialEvent(
  action: ChatAction,
  targetViewer: string | null | undefined,
  now = Date.now(),
): NubiSocialEvent | null {
  const cleanTarget =
    targetViewer?.trim();

  if (!cleanTarget) {
    return null;
  }

  return {
    id: createSocialEventId(),

    type: getEventType(action),

    actor: "nubi",

    targetViewer: cleanTarget,

    action,

    message: createSocialMessage(
      action,
      cleanTarget,
    ),

    timestamp: now,
  };
}
