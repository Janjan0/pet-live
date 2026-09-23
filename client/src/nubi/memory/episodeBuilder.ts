import type { ChatAction } from "../../chat/interpreter";
import type { NubiEpisode } from "./episodicMemory";
import type { ViewerProfile } from "../../viewer/viewerSystem";

type BuildEpisodeInput = {
  action: ChatAction;
  user: string | null;
  targetViewer?: string | null;
  response?: string;
  autonomous?: boolean;
  viewerProfile?: ViewerProfile | null;
};

const actionImportance: Partial<
  Record<ChatAction, number>
> = {
  feed: 35,
  drink: 35,
  pet: 45,
  hug: 60,
  kiss: 60,
  play: 55,
  dance: 55,
  sleep: 30,
  wake: 25,
  bath: 40,
  toilet: 30,
  greet: 20,
  laugh: 35,
  comfort: 65,
  tease: 50,
};

const actionSummary: Partial<
  Record<ChatAction, string>
> = {
  feed: "Nubi recibió comida.",
  drink: "Nubi recibió agua.",
  pet: "Nubi recibió mimos.",
  hug: "Nubi recibió un abrazo.",
  kiss: "Nubi recibió un beso.",
  play: "Nubi jugó con alguien.",
  dance: "Nubi bailó con alguien.",
  sleep: "Nubi se fue a descansar.",
  wake: "Nubi despertó.",
  bath: "Nubi recibió un baño.",
  toilet: "Nubi fue al baño.",
  greet: "Nubi recibió un saludo.",
  laugh: "Nubi compartió una risa.",
  comfort: "Nubi recibió cariño y consuelo.",
  tease: "Nubi tuvo una pequeña travesura.",
};

export function buildEpisode(
  input: BuildEpisodeInput,
): Omit<NubiEpisode, "id" | "timestamp"> | null {
  const summary =
    actionSummary[input.action];

  if (!summary) {
    return null;
  }

  let importance =
    actionImportance[input.action] ?? 20;

  /*
   * Las acciones autónomas tienen otro significado:
   * no fueron provocadas directamente por un espectador.
   */
  if (input.autonomous) {
    importance += 5;
  }

  /*
   * Una respuesta particularmente emocional
   * puede hacer que el episodio sea ligeramente
   * más importante.
   */
  if (
    input.response &&
    /🥺|💕|❤️|😂|😏|✨|🐾/.test(
      input.response,
    )
  ) {
    importance += 5;
  }

  let summaryWithContext =
    summary;

  /*
   * Si Nubi actuó de forma autónoma hacia una persona,
   * el recuerdo conserva también el objetivo.
   */
  if (
    input.autonomous &&
    input.targetViewer
  ) {
    summaryWithContext =
      `${summary.replace(
        "con alguien.",
        `con ${input.targetViewer}.`,
      )}`;
  }

  /*
   * Si conocemos al espectador, el recuerdo conserva
   * su identidad en la experiencia.
   */
  if (
    input.user &&
    !input.autonomous
  ) {
    summaryWithContext =
      `${input.user}: ${summary}`;
  }

  /*
   * Una interacción con alguien que ya tiene
   * un vínculo fuerte con Nubi merece un poco
   * más de peso en la memoria.
   */
  if (
    input.viewerProfile &&
    input.viewerProfile.bond >= 60
  ) {
    importance += 10;
  }

  /*
   * Un espectador nuevo también puede convertirse
   * en un recuerdo inicial importante.
   */
  if (
    input.viewerProfile &&
    input.viewerProfile.totalInteractions <= 1
  ) {
    importance += 5;
  }

  return {
    type: input.autonomous
      ? "behavior"
      : "interaction",
    summary: summaryWithContext,
    user: input.autonomous
      ? null
      : input.user,
    targetViewer: input.autonomous
      ? input.targetViewer ?? null
      : null,
    action: input.action,
    importance: Math.min(
      100,
      importance,
    ),
  };
}
