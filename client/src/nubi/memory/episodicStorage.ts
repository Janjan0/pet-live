import type {
  NubiEpisode,
} from "./episodicMemory";

const STORAGE_KEY =
  "pet-live:nubi:episodic-memory:v1";

export function loadEpisodicMemory(): NubiEpisode[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is NubiEpisode =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.summary === "string" &&
        typeof item.timestamp === "number" &&
        typeof item.importance === "number",
    );
  } catch (error) {
    console.error(
      "❌ No se pudo cargar la memoria episódica:",
      error,
    );

    return [];
  }
}

export function saveEpisodicMemory(
  episodes: NubiEpisode[],
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(episodes),
    );
  } catch (error) {
    console.error(
      "❌ No se pudo guardar la memoria episódica:",
      error,
    );
  }
}
