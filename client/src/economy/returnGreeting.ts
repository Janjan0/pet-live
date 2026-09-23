import type { ViewerProfile } from "../viewer/viewerSystem";
import { spendViewerCoins } from "../viewer/viewerSystem";

export const RETURN_GREETING_PRICE = 100;
export const RETURN_GREETING_MAX_LENGTH = 180;
export const RETURN_GREETING_MAX_PENDING = 5;

const STORAGE_KEY =
  "pet-live:nubi:return-greetings:v1";

export type ReturnGreeting = {
  id: string;
  viewerId: string;
  message: string;
  purchasedAt: number;
  usedAt: number | null;
};

function readGreetings(): ReturnGreeting[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      STORAGE_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is ReturnGreeting =>
        item &&
        typeof item.id === "string" &&
        typeof item.viewerId === "string" &&
        typeof item.message === "string" &&
        typeof item.purchasedAt === "number" &&
        (item.usedAt === null ||
          typeof item.usedAt === "number"),
    );
  } catch {
    return [];
  }
}

function writeGreetings(
  greetings: ReturnGreeting[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(greetings),
    );
  } catch {
    // La economía principal no debe romperse
    // si el almacenamiento local falla.
  }
}

function createGreetingId(
  viewerId: string,
  now: number,
): string {
  return `return-greeting-${viewerId}-${now}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export type ReturnGreetingPurchaseResult = {
  accepted: boolean;
  viewer: ViewerProfile;
  greeting: ReturnGreeting | null;
  message: string;
};

export function purchaseReturnGreeting(
  viewer: ViewerProfile,
  message: string,
  now = Date.now(),
): ReturnGreetingPurchaseResult {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return {
      accepted: false,
      viewer,
      greeting: null,
      message:
        "Escribe el mensaje que quieres que Nubi diga.",
    };
  }

  if (
    cleanMessage.length >
    RETURN_GREETING_MAX_LENGTH
  ) {
    return {
      accepted: false,
      viewer,
      greeting: null,
      message: `El saludo puede tener máximo ${RETURN_GREETING_MAX_LENGTH} caracteres.`,
    };
  }

  const greetings = readGreetings();

  const pending = greetings.filter(
    (greeting) =>
      greeting.viewerId === viewer.viewerId &&
      greeting.usedAt === null,
  );

  if (
    pending.length >=
    RETURN_GREETING_MAX_PENDING
  ) {
    return {
      accepted: false,
      viewer,
      greeting: null,
      message:
        "Ya tienes demasiados saludos de regreso pendientes.",
    };
  }

  const updatedViewer = spendViewerCoins(
    viewer,
    RETURN_GREETING_PRICE,
  );

  if (!updatedViewer) {
    return {
      accepted: false,
      viewer,
      greeting: null,
      message: `Necesitas ${RETURN_GREETING_PRICE} 🪙 para comprar un saludo de regreso.`,
    };
  }

  const greeting: ReturnGreeting = {
    id: createGreetingId(
      viewer.viewerId,
      now,
    ),
    viewerId: viewer.viewerId,
    message: cleanMessage,
    purchasedAt: now,
    usedAt: null,
  };

  /*
   * El texto comprado se guarda como CONTENIDO.
   *
   * No se interpreta con Gemini ni se convierte
   * en una instrucción para el cerebro de Nubi.
   */
  writeGreetings([
    ...greetings,
    greeting,
  ]);

  return {
    accepted: true,
    viewer: updatedViewer,
    greeting,
    message:
      "🎁 Tu saludo quedó guardado. Nubi lo dirá cuando regreses después de una ausencia.",
  };
}

export function getPendingReturnGreetings(
  viewerId: string,
): ReturnGreeting[] {
  return readGreetings().filter(
    (greeting) =>
      greeting.viewerId === viewerId &&
      greeting.usedAt === null,
  );
}

/**
 * Consume exactamente un saludo pendiente.
 *
 * Solo debe llamarse después de confirmar que el
 * espectador realmente regresó de una ausencia.
 */
export function consumeReturnGreeting(
  viewerId: string,
  now = Date.now(),
): ReturnGreeting | null {
  const greetings = readGreetings();

  const index = greetings.findIndex(
    (greeting) =>
      greeting.viewerId === viewerId &&
      greeting.usedAt === null,
  );

  if (index === -1) {
    return null;
  }

  const greeting = greetings[index];

  const updated: ReturnGreeting = {
    ...greeting,
    usedAt: now,
  };

  const next = [...greetings];
  next[index] = updated;

  writeGreetings(next);

  return updated;
}
