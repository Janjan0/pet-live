export type NubiEpisodeType =
  | "interaction"
  | "learning"
  | "emotion"
  | "discovery"
  | "behavior";

export type NubiEpisode = {
  id: string;
  type: NubiEpisodeType;
  summary: string;
  user: string | null;
  targetViewer?: string | null;
  action: string | null;
  timestamp: number;
  importance: number;
};

const MAX_EPISODES = 100;

function createEpisodeId(): string {
  return `episode-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function clampImportance(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function rememberEpisode(
  episodes: NubiEpisode[],
  episode: Omit<
    NubiEpisode,
    "id" | "timestamp"
  >,
): NubiEpisode[] {
  const nextEpisode: NubiEpisode = {
    ...episode,
    id: createEpisodeId(),
    timestamp: Date.now(),
    importance: clampImportance(
      episode.importance,
    ),
  };

  const next = [
    ...episodes,
    nextEpisode,
  ];

  /*
   * Nubi no necesita recordar infinitamente.
   *
   * Conservamos los episodios más recientes,
   * pero cuando superamos el límite damos prioridad
   * a los recuerdos importantes.
   */
  if (next.length <= MAX_EPISODES) {
    return next;
  }

  return [...next]
    .sort(
      (a, b) =>
        b.importance - a.importance ||
        b.timestamp - a.timestamp,
    )
    .slice(0, MAX_EPISODES)
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp,
    );
}

export function getRecentEpisodes(
  episodes: NubiEpisode[],
  limit = 5,
): NubiEpisode[] {
  return [...episodes]
    .sort(
      (a, b) =>
        b.timestamp - a.timestamp,
    )
    .slice(0, Math.max(1, limit));
}

export function getImportantEpisodes(
  episodes: NubiEpisode[],
  minimumImportance = 60,
  limit = 10,
): NubiEpisode[] {
  return [...episodes]
    .filter(
      (episode) =>
        episode.importance >=
        minimumImportance,
    )
    .sort(
      (a, b) =>
        b.importance - a.importance ||
        b.timestamp - a.timestamp,
    )
    .slice(0, Math.max(1, limit));
}
