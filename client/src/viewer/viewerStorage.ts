import type { PetId } from "../world/petTypes";
import type { ViewerProfile } from "./viewerSystem";

const STORAGE_KEY =
  "nubi.viewer-profiles.v1";

export type ViewerStorage = Record<
  PetId,
  ViewerProfile[]
>;

function emptyStorage(): ViewerStorage {
  return {};
}

export function loadViewerStorage(): ViewerStorage {
  if (
    typeof globalThis.localStorage ===
    "undefined"
  ) {
    return emptyStorage();
  }

  try {
    const raw =
      globalThis.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return emptyStorage();
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return emptyStorage();
    }

    return parsed as ViewerStorage;
  } catch {
    return emptyStorage();
  }
}

export function saveViewerStorage(
  viewers: ViewerStorage,
): void {
  if (
    typeof globalThis.localStorage ===
    "undefined"
  ) {
    return;
  }

  try {
    globalThis.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(viewers),
    );
  } catch {
    /*
     * El almacenamiento local no debe
     * romper el funcionamiento de Nubi.
     */
  }
}

export function clearViewerStorage(): void {
  if (
    typeof globalThis.localStorage ===
    "undefined"
  ) {
    return;
  }

  try {
    globalThis.localStorage.removeItem(
      STORAGE_KEY,
    );
  } catch {
    // Ignorar errores de almacenamiento.
  }
}
