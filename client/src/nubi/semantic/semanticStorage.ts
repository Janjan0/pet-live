import type {
  NubiSemanticMemory,
} from "./types";

const STORAGE_KEY =
  "pet-live:nubi:semantic-memory:v1";

export function loadSemanticMemory(): NubiSemanticMemory[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "❌ No se pudo cargar la memoria semántica:",
      error,
    );

    return [];
  }
}

export function saveSemanticMemory(
  memories: NubiSemanticMemory[],
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(memories),
    );
  } catch (error) {
    console.error(
      "❌ No se pudo guardar la memoria semántica:",
      error,
    );
  }
}
