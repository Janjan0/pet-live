import type { ChatAction } from "../chat/interpreter";
import type { NubiSocialPerson } from "./nubiSocialMemory";

function actionLabel(action: ChatAction | null): string | null {
  switch (action) {
    case "feed":
      return "darme comida";
    case "drink":
      return "darme agua";
    case "bath":
      return "ayudarme a bañarme";
    case "toilet":
      return "cuidarme cuando lo necesito";
    case "sleep":
      return "ayudarme a descansar";
    case "pet":
      return "acariciarme";
    case "hug":
      return "abrazarme";
    case "kiss":
      return "darme besitos";
    case "comfort":
      return "darme cariño";
    case "play":
      return "jugar conmigo";
    case "dance":
      return "bailar conmigo";
    case "tease":
      return "hacerme travesuras";
    case "greet":
      return "saludarme";
    default:
      return null;
  }
}

function recentLabel(lastSeen: number): string {
  const elapsed = Date.now() - lastSeen;

  if (elapsed < 5 * 60 * 1000) {
    return "acaba de aparecer por aquí";
  }

  if (elapsed < 60 * 60 * 1000) {
    return "estuvo por aquí hace un rato";
  }

  if (elapsed < 24 * 60 * 60 * 1000) {
    return "estuvo por aquí hoy";
  }

  if (elapsed < 7 * 24 * 60 * 60 * 1000) {
    return "hace unos días que estuvo por aquí";
  }

  return "hace tiempo que no aparece por aquí";
}

export function createRelationshipThought(
  person: NubiSocialPerson,
): string | null {
  if (!person.user) {
    return null;
  }

  const name = person.user;
  const action = actionLabel(person.favoriteAction);

  switch (person.role) {
    case "caregiver":
      if (action) {
        return `Nubi piensa en ${name}, que suele ${action}. 🐾`;
      }

      return `Nubi recuerda que ${name} suele cuidarla. 🐾`;

    case "playmate":
      if (action) {
        return `Nubi se acuerda de ${name} y de cuando suelen ${action}. 👀🐾`;
      }

      return `Nubi se pregunta si ${name} tendrá ganas de jugar otra vez. 👀🐾`;

    case "affectionate":
      if (action) {
        return `Nubi recuerda el cariño de ${name}, especialmente cuando suele ${action}. 🐾💕`;
      }

      return `Nubi recuerda el cariño de ${name}. 🐾💕`;

    case "mixed":
      return `Nubi piensa en ${name} y en todo lo que suelen hacer juntos. 🐾`;

    case "companion":
      if (person.familiarity === "known") {
        return `Nubi reconoce a ${name} entre la gente del chat. 👀🐾`;
      }

      return `Nubi todavía está conociendo a ${name}. 👀🐾`;

    default:
      return null;
  }
}

export function createRelationshipPresenceThought(
  person: NubiSocialPerson,
): string | null {
  if (!person.user) {
    return null;
  }

  return `Nubi nota que ${person.user} ${recentLabel(person.lastSeen)}. 👀🐾`;
}
