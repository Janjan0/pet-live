import type { ChatAction } from "../chat/interpreter";

export type ViewerMemory = {
  user: string;

  interactions: number;

  affection: number;

  plays: number;

  feeds: number;

  gifts: number;

  lastAction: ChatAction;

  lastSeen: number;
};

export function rememberInteraction(
  memories: ViewerMemory[],
  user: string,
  action: ChatAction,
  now = Date.now(),
  gift = false,
): ViewerMemory[] {
  const existing = memories.find(
    (memory) =>
      memory.user.toLowerCase() === user.toLowerCase(),
  );

  if (!existing) {
    return [
      ...memories,
      {
        user,
        interactions: 1,
        affection:
          action === "kiss" ||
          action === "hug" ||
          action === "pet"
            ? 1
            : 0,
        plays:
          action === "play" ||
          action === "dance"
            ? 1
            : 0,
        feeds: action === "feed" ? 1 : 0,
        gifts: gift ? 1 : 0,
        lastAction: action,
        lastSeen: now,
      },
    ]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 500);
  }

  return memories
    .map((memory) =>
      memory.user.toLowerCase() === user.toLowerCase()
        ? {
            ...memory,

            interactions:
              memory.interactions + 1,

            affection:
              memory.affection +
              (action === "kiss" ||
              action === "hug" ||
              action === "pet"
                ? 1
                : 0),

            plays:
              memory.plays +
              (action === "play" ||
              action === "dance"
                ? 1
                : 0),

            feeds:
              memory.feeds +
              (action === "feed" ? 1 : 0),

            gifts:
              memory.gifts +
              (gift ? 1 : 0),

            lastAction: action,
            lastSeen: now,
          }
        : memory,
    )
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 500);
}

export function findViewer(
  memories: ViewerMemory[],
  user: string,
): ViewerMemory | null {
  return (
    memories.find(
      (memory) =>
        memory.user.toLowerCase() === user.toLowerCase(),
    ) ?? null
  );
}

export function calculateViewerBond(
  memory: ViewerMemory,
): number {
  const score =
    memory.interactions * 0.5 +
    memory.affection * 3 +
    memory.plays * 1 +
    memory.feeds * 1 +
    memory.gifts * 4;

  return Math.min(100, Math.round(score));
}
