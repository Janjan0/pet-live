import type { NubiStage, PetState } from "./nubiState";

export type NubiIdentityQuestion =
  | "who"
  | "name"
  | "type"
  | "age"
  | "self"
  | "personality"
  | "hunger"
  | "thirst"
  | "energy"
  | "happiness"
  | "health"
  | "hygiene"
  | "bathroom"
  | "love"
  | "social";

export type NubiIdentityAnswer = {
  question: NubiIdentityQuestion;
  response: string;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function stageLabel(stage: NubiStage): string {
  switch (stage) {
    case "egg":
      return "un huevito";
    case "baby":
      return "una bebé";
    case "child":
      return "una niña";
    case "adult":
      return "una adulta";
  }
}

function calculateAge(birthDate: number, now = Date.now()) {
  const safeBirthDate = Number.isFinite(birthDate)
    ? birthDate
    : now;

  const elapsed = Math.max(0, now - safeBirthDate);

  const totalDays = Math.floor(
    elapsed / (1000 * 60 * 60 * 24),
  );

  const years = Math.floor(totalDays / 365);

  const remainingAfterYears =
    totalDays - years * 365;

  const months = Math.floor(
    remainingAfterYears / 30,
  );

  const days =
    remainingAfterYears - months * 30;

  return {
    years,
    months,
    days,
  };
}

export function formatNubiAge(
  birthDate: number,
  now = Date.now(),
): string {
  const age = calculateAge(birthDate, now);

  if (age.years > 0) {
    if (age.months > 0) {
      return `${age.years} ${age.years === 1 ? "año" : "años"} y ${age.months} ${age.months === 1 ? "mes" : "meses"}`;
    }

    return `${age.years} ${age.years === 1 ? "año" : "años"}`;
  }

  if (age.months > 0) {
    if (age.days > 0) {
      return `${age.months} ${age.months === 1 ? "mes" : "meses"} y ${age.days} ${age.days === 1 ? "día" : "días"}`;
    }

    return `${age.months} ${age.months === 1 ? "mes" : "meses"}`;
  }

  if (age.days > 0) {
    return `${age.days} ${age.days === 1 ? "día" : "días"}`;
  }

  return "unas horitas";
}

function needFeeling(
  value: number,
  low: string,
  medium: string,
  high: string,
): string {
  if (value < 30) return low;
  if (value < 65) return medium;
  return high;
}

function bathroomFeeling(value: number): string {
  if (value >= 80) {
    return "¡Sí! Necesito ir al baño urgentemente 😳🚽";
  }

  if (value >= 50) {
    return "Un poquito... creo que pronto voy a necesitar ir 🚽🐾";
  }

  return "No, estoy bien por ahora 😌🐾";
}

export function interpretNubiIdentity(
  text: string,
  state: PetState,
  now = Date.now(),
): NubiIdentityAnswer | null {
  const normalized = normalize(text);

  /*
   * ==========================================================
   * LLAMAR A NUBI
   * ==========================================================
   *
   * "Nubi" no es una palabra desconocida.
   * Es el nombre de Nubi.
   */
  if (
    normalized === "nubi" ||
    normalized === "hey nubi" ||
    normalized === "oye nubi" ||
    normalized === "hola nubi"
  ) {
    return {
      question: "self",
      response:
        "¿Sí? 👀🐾 Aquí estoy. ¿Me llamaste?",
    };
  }

  /*
   * ==========================================================
   * IDENTIDAD
   * ==========================================================
   */

  if (
    /(?:quien|quién)\s+(?:eres|es\s+nubi)/iu.test(
      normalized,
    )
  ) {
    return {
      question: "who",
      response:
        `Soy ${state.name} 🐾. Soy una mascota virtual y vivo aquí con ustedes. Ahora mismo soy ${stageLabel(state.stage)}. 💕`,
    };
  }

  if (
    /(?:como|cómo)\s+te\s+llamas/iu.test(normalized) ||
    /(?:cual|cuál)\s+es\s+tu\s+nombre/iu.test(normalized)
  ) {
    return {
      question: "name",
      response:
        `Me llamo ${state.name} 🐾💕. Soy Nubi.`,
    };
  }

  if (
    /(?:que|qué)\s+eres(?:\s+tu)?(?:\?|!|\.|$)/iu.test(
      normalized,
    ) ||
    /(?:que|qué)\s+es\s+nubi(?:\?|!|\.|$)/iu.test(
      normalized,
    )
  ) {
    return {
      question: "type",
      response:
        "Soy Nubi, una mascota virtual 🐾. Tengo necesidades, personalidad, memoria y puedo aprender de ustedes. 🧠💕",
    };
  }

  if (
    /(?:cuantos|cuántos)\s+(?:anos|años)\s+tienes/iu.test(
      normalized,
    ) ||
    /(?:que|qué)\s+edad\s+tienes/iu.test(normalized) ||
    /(?:cual|cuál)\s+es\s+tu\s+edad/iu.test(normalized)
  ) {
    return {
      question: "age",
      response:
        `Tengo ${formatNubiAge(state.birthDate, now)} 🥺🐾. Todavía soy ${stageLabel(state.stage)}.`,
    };
  }

  if (
    /(?:eres|tu\s+eres|tú\s+eres)\s+nubi/iu.test(
      normalized,
    )
  ) {
    return {
      question: "self",
      response:
        "¡Sí! 😌🐾 Yo soy Nubi. ¿Quién más iba a ser?",
    };
  }

  /*
   * ==========================================================
   * PERSONALIDAD
   * ==========================================================
   */

  if (
    /(?:como|cómo)\s+eres(?:\s+tu|\s+nubi)?(?:\?|!|\.|$)/iu.test(
      normalized,
    ) ||
    /(?:cual|cuál)\s+es\s+tu\s+personalidad/iu.test(
      normalized,
    )
  ) {
    const traits: string[] = [];

    if (state.personality.affectionate >= 80) {
      traits.push("muy cariñosa");
    }

    if (state.personality.playful >= 70) {
      traits.push("juguetona");
    }

    if (state.personality.curiosity >= 80) {
      traits.push("curiosa");
    }

    if (state.personality.mischievous >= 60) {
      traits.push("un poquito traviesa");
    }

    const description =
      traits.length > 0
        ? traits.join(", ")
        : "todavía estoy descubriendo cómo soy";

    return {
      question: "personality",
      response:
        `Soy ${description}. 🐾💕 Pero todavía estoy aprendiendo y mi personalidad puede cambiar con lo que vivimos juntos.`,
    };
  }

  /*
   * ==========================================================
   * AUTOCONOCIMIENTO DEL ESTADO
   * ==========================================================
   *
   * Estas preguntas tienen prioridad sobre el intérprete
   * de acciones.
   *
   * Por ejemplo:
   * "¿Nubi tiene hambre?"
   *
   * NO significa:
   * "feed"
   *
   * Significa:
   * consultar state.hunger.
   */

  if (
    /(?:tienes|tiene)\s+(?:mucha\s+|un\s+poco\s+)?hambre/iu.test(
      normalized,
    ) ||
    /(?:estas|estás)\s+hambrienta/iu.test(normalized) ||
    /nubi.*hambre/iu.test(normalized)
  ) {
    return {
      question: "hunger",
      response:
        needFeeling(
          state.hunger,
          "Sí... tengo bastante hambre 🥺🍎",
          "Tengo un poquito de hambre, pero todavía aguanto 😌🍎",
          "No mucho. Estoy bastante satisfecha ahora mismo 🐾💕",
        ),
    };
  }

  if (
    /(?:tienes|tiene)\s+(?:mucha\s+|un\s+poco\s+)?sed/iu.test(
      normalized,
    ) ||
    /(?:estas|estás)\s+sedienta/iu.test(normalized) ||
    /nubi.*sed/iu.test(normalized)
  ) {
    return {
      question: "thirst",
      response:
        needFeeling(
          state.thirst,
          "Sí... tengo bastante sed 🥺💧",
          "Tengo un poquito de sed 💧🐾",
          "No, estoy bien hidratada 😌💧",
        ),
    };
  }

  if (
    /(?:estas|estás)\s+(?:cansada|cansado)/iu.test(normalized) ||
    /(?:tienes|tiene)\s+sueño/iu.test(normalized) ||
    /(?:tienes|tiene)\s+energia/iu.test(normalized) ||
    /nubi.*(?:cansada|cansado|sueño)/iu.test(normalized)
  ) {
    return {
      question: "energy",
      response:
        needFeeling(
          state.energy,
          "Sí... estoy muy cansadita 🥺😴",
          "Estoy un poquito cansada, pero todavía tengo energía para estar contigo 🐾",
          "¡Estoy llena de energía! ⚡🐾",
        ),
    };
  }

  if (
    /(?:eres|estas|estás)\s+(?:feliz|contenta|feliz)/iu.test(
      normalized,
    ) ||
    /(?:tienes|tiene)\s+(?:mucha\s+)?felicidad/iu.test(
      normalized,
    ) ||
    /nubi.*(?:feliz|contenta)/iu.test(normalized)
  ) {
    return {
      question: "happiness",
      response:
        needFeeling(
          state.happiness,
          "No mucho... necesito un poquito de cariño 🥺",
          "Estoy más o menos feliz, pero unos mimos me vendrían bien 🐾💕",
          "¡Sí! Estoy muy feliz ahora mismo 🥰🐾",
        ),
    };
  }

  if (
    /(?:estas|estás)\s+(?:sana|enferma)/iu.test(normalized) ||
    /(?:como|cómo)\s+esta\s+nubi/iu.test(normalized) ||
    /nubi.*(?:sana|enferma|salud)/iu.test(normalized)
  ) {
    if (state.health < 30) {
      return {
        question: "health",
        response:
          "No me siento muy bien... necesito que me cuiden 🥺🐾",
      };
    }

    if (state.health < 65) {
      return {
        question: "health",
        response:
          "Estoy un poquito delicada, pero todavía estoy bien 🐾🥺",
      };
    }

    return {
      question: "health",
      response:
        "Estoy bien de salud ahora mismo 😌🐾❤️",
    };
  }

  if (
    /(?:estas|estás)\s+sucia/iu.test(normalized) ||
    /(?:necesitas|necesita)\s+(?:un\s+)?baño/iu.test(normalized) ||
    /nubi.*sucia/iu.test(normalized)
  ) {
    return {
      question: "hygiene",
      response:
        needFeeling(
          state.hygiene,
          "Sí... estoy bastante sucia 🥺🛁",
          "Estoy un poquito sucia. Un baño no me vendría mal 🛁🐾",
          "Estoy bien limpita 😌✨🐾",
        ),
    };
  }

  if (
    /(?:tienes|tiene)\s+que\s+ir\s+al\s+baño/iu.test(normalized) ||
    /(?:necesitas|necesita)\s+ir\s+al\s+baño/iu.test(normalized) ||
    /nubi.*baño/iu.test(normalized)
  ) {
    return {
      question: "bathroom",
      response: bathroomFeeling(state.bathroom),
    };
  }

  if (
    /(?:me|te)\s+quieres/iu.test(normalized) ||
    /(?:quieres|quiere)\s+a\s+(?:mi|mí)/iu.test(normalized) ||
    /(?:tienes|tiene)\s+amor/iu.test(normalized) ||
    /nubi.*amor/iu.test(normalized)
  ) {
    return {
      question: "love",
      response:
        needFeeling(
          state.love,
          "Todavía necesito sentir un poquito más de cariño 🥺❤️",
          "Siento bastante cariño ahora mismo 🐾💕",
          "¡Siento muchísimo amor! 🥰❤️🐾",
        ),
    };
  }

  if (
    /(?:estas|estás)\s+sola/iu.test(normalized) ||
    /(?:quieres|quiere)\s+compañia/iu.test(normalized) ||
    /(?:tienes|tiene)\s+amigos/iu.test(normalized) ||
    /nubi.*(?:sola|compañia|amigos)/iu.test(normalized)
  ) {
    return {
      question: "social",
      response:
        needFeeling(
          state.social,
          "Sí... me vendría bien un poquito de compañía 🥺🐾",
          "Me gusta tener gente cerca de mí 🐾💕",
          "¡Me encanta estar acompañada! 🥰🐾",
        ),
    };
  }

  return null;
}
