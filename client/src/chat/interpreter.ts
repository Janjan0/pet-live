
export type ChatAction =
  | "feed"
  | "drink"
  | "pet"
  | "hug"
  | "kiss"
  | "play"
  | "dance"
  | "sleep"
  | "wake"
  | "bath"
  | "toilet"
  | "greet"
  | "laugh"
  | "comfort"
  | "tease"
  | "none";

export type ChatSentiment =
  | "positive"
  | "negative"
  | "neutral"
  | "playful";

export type ChatSocialIntent =
  | "missing_me"
  | "noticed_absence"
  | "returned";

export type ChatInterpretation = {
  action: ChatAction;
  confidence: number;
  response: string;
  sentiment?: ChatSentiment;
  addressedToNubi?: boolean;
  socialIntent?: ChatSocialIntent;

  /**
   * Expresión desconocida detectada dentro de una
   * construcción como "te quiero + X".
   */
  unknownConstructionTerm?: string;
};

const patterns: Array<{
  action: ChatAction;
  words: string[];
  response: string;
}> = [
  {
    action: "feed",
    words: [
      "come",
      "comer",
      "comida",
      "aliment",
      "dale comida",
      "ten comida",
      "ñam",
      "hambre",
      "hambriento",
      "jarto",
      "harto",
      "🍎",
      "🍔",
      "🍕",
      "🍗",
      "🍖",
      "🍰",
    ],
    response: "Nubi quiere comida 🍎",
  },
  {
    action: "drink",
    words: [
      "agua",
      "toma agua",
      "dale agua",
      "beber",
      "bebe",
      "tiene sed",
      "sed",
      "seco",
      "💧",
      "🥤",
    ],
    response: "Nubi necesita agua 💧",
  },
  {
    action: "kiss",
    words: [
      "beso",
      "besito",
      "besame",
      "bésame",
      "dame un beso",
      "dame un besito",
      "😘",
      "💋",
    ],
    response: "Nubi recibió un beso 💋",
  },
  {
    action: "hug",
    words: [
      "abrazo",
      "abrazalo",
      "abrazalo",
      "abrazar",
      "abrazame",
      "🤗",
    ],
    response: "Nubi recibe un abrazo 🤗",
  },
  {
    action: "pet",
    words: [
      "acaricia",
      "acariciar",
      "acaricialo",
      "mimarlo",
      "mimarlo",
      "mimos",
      "🥰",
    ],
    response: "Nubi recibe caricias 🥰",
  },
  {
    /*
     * Expresiones afectivas.
     *
     * No las mandamos a Gemini: forman parte del lenguaje
     * emocional básico que Nubi debe entender localmente.
     */
    action: "pet",
    words: [
      "te quiero",
      "te amo",
      "te adoro",
      "quiero a nubi",
      "amo a nubi",
      "adoro a nubi",
      "quiero mucho a nubi",
      "amo mucho a nubi",
      "❤️",
      "💕",
      "💖",
      "💗",
      "💓",
      "💞",
    ],
    response: "Nubi siente todo ese amor 🥹❤️",
  },
  {
    action: "play",
    words: [
      "juega",
      "jugar",
      "juguemos",
      "vamos a jugar",
      "diviertete",
      "diviértete",
      "juguete",
      "🎮",
      "🧸",
      "⚽",
    ],
    response: "Nubi quiere jugar 🎮",
  },
  {
    action: "dance",
    words: [
      "baila",
      "bailar",
      "baile",
      "baila nubi",
      "💃",
      "🕺",
    ],
    response: "Nubi va a bailar 💃",
  },
  {
    action: "sleep",
    words: [
      "duerme",
      "dormir",
      "a dormir",
      "descansa",
      "descansar",
      "vete a dormir",
      "😴",
      "💤",
    ],
    response: "Nubi tiene sueño 😴",
  },
  {
    action: "wake",
    words: [
      "despierta",
      "despertar",
      "levantate",
      "levántate",
      "despiertalo",
    ],
    response: "Nubi se está despertando ☀️",
  },
  {
    action: "bath",
    words: [
      "baña",
      "bañalo",
      "báñalo",
      "bañarlo",
      "baño",
      "ducha",
      "limpia a nubi",
      "limpialo",
      "límpialo",
      "🚿",
      "🛁",
    ],
    response: "Nubi se está bañando 🛁",
  },
  {
    action: "toilet",
    words: [
      "popi",
      "popó",
      "popo",
      "hacer popi",
      "hacer popó",
      "hacer popo",
      "baño",
      "ir al baño",
      "ve al baño",
      "🚽",
      "💩",
    ],
    response: "Nubi necesita ir al baño 🚽",
  },
  {
    action: "greet",
    words: [
      "hola nubi",
      "hola",
      "hey nubi",
      "buenas",
      "buenos dias",
      "buenas tardes",
      "buenas noches",
      "👋",
      "🙋",
    ],
    response: "Nubi saluda al chat 👋",
  },
  {
    action: "laugh",
    words: [
      "rie",
      "ríe",
      "risa",
      "jajaja",
      "jajajaja",
      "😂",
      "🤣",
    ],
    response: "Nubi se está riendo 😂",
  },
  {
    action: "comfort",
    words: [
      "consuelalo",
      "consuelo",
      "anima a nubi",
      "pobrecito",
      "no llores",
      "tranquilo",
      "🥺",
    ],
    response: "Nubi recibe cariño 🥺💕",
  },
  {
    /*
     * Interacciones juguetonas.
     *
     * "Te quiero morder" debe entenderse como una
     * interacción juguetona, no como una instrucción literal.
     */
    action: "tease",
    words: [
      "morder",
      "mordida",
      "muerde",
      "mordisquito",
      "te quiero morder",
      "quiero morder a nubi",
      "voy a morder a nubi",
    ],
    response: "¡Nubi recibió un mordisquito! 😳😂🐾",
  },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/*
 * ============================================================
 * CONSTRUCCIONES LINGÜÍSTICAS
 * ============================================================
 *
 * Nubi no debe interpretar "te quiero" como una acción fija.
 *
 * "te quiero"             → cariño
 * "te quiero besar"       → kiss
 * "te quiero abrazar"     → hug
 * "te quiero comer"       → feed
 * "te quiero morder"      → tease
 *
 * La construcción se analiza antes de los patrones generales
 * para que el verbo tenga prioridad sobre "te quiero".
 */

const constructionActions: Array<{
  words: string[];
  action: ChatAction;
  response: string;
}> = [
  {
    words: [
      "besar",
      "besarte",
      "darte un beso",
      "darte un besito",
    ],
    action: "kiss",
    response: "¡Nubi recibió un besito! 💋🥰",
  },
  {
    words: [
      "abrazar",
      "abrazarte",
      "darte un abrazo",
    ],
    action: "hug",
    response: "Nubi recibe un abrazo 🤗❤️",
  },
  {
    words: [
      "acariciar",
      "acariciarte",
      "mimarte",
      "darte mimos",
    ],
    action: "pet",
    response: "Nubi recibe muchos mimos 🥰🐾",
  },
  {
    words: [
      "comer",
      "comerte",
      "alimentar",
      "alimentarte",
      "darte comida",
    ],
    action: "feed",
    response: "Nubi cree que es hora de comer 🍎🐾",
  },
  {
    words: [
      "beber",
      "beberte",
      "darte agua",
    ],
    action: "drink",
    response: "Nubi recibe agüita 💧🐾",
  },
  {
    words: [
      "jugar",
      "jugar contigo",
      "jugar contigo nubi",
    ],
    action: "play",
    response: "¡Nubi quiere jugar! 🎮🐾",
  },
  {
    words: [
      "bailar",
      "verte bailar",
      "hacerte bailar",
    ],
    action: "dance",
    response: "¡Nubi se pone a bailar! 💃🐾",
  },
  {
    words: [
      "dormir",
      "verte dormir",
      "hacerte dormir",
    ],
    action: "sleep",
    response: "Nubi empieza a tener sueñito 😴🐾",
  },
  {
    words: [
      "reir",
      "reirte",
      "hacerte reir",
      "hacerte reír",
    ],
    action: "laugh",
    response: "Nubi se ríe contigo 😂❤️",
  },
  {
    words: [
      "consolar",
      "consolarte",
      "animarte",
    ],
    action: "comfort",
    response: "Nubi recibe y devuelve cariño 🥺❤️",
  },
  {
    words: [
      "morder",
      "morderte",
      "dar un mordisco",
      "darte un mordisquito",
      "hacerte cosquillas",
    ],
    action: "tease",
    response: "¡Nubi recibió un ataque de cariño! 😳😂🐾",
  },
  {
    /*
     * Expresiones que suenan agresivas pero que, dentro
     * del contexto de una mascota virtual, se tratan como
     * juego/travesura y no como acciones literales.
     */
    words: [
      "matar",
      "matarte",
      "hacerte explotar",
      "explotarte",
      "destruirte",
      "destruir a nubi",
    ],
    action: "tease",
    response: "¡Nubi se prepara para la travesura! 😈💥🐾",
  },
];

function interpretConstruction(
  normalized: string,
): ChatInterpretation | null {
  /*
   * "te quiero + acción" es una construcción lingüística.
   *
   * Primero intentamos resolverla con las acciones conocidas.
   * Si no existe una acción local, devolvemos la expresión
   * desconocida para que el sistema de aprendizaje pueda
   * investigarla.
   */
  const construction =
    /(?:^|\s)(?:yo\s+)?te\s+quiero\s+(.+)$/iu.exec(
      normalized,
    );

  if (!construction) {
    /*
     * También entendemos:
     * "quiero + acción"
     */
    const simple =
      /(?:^|\s)(?:yo\s+)?quiero\s+(.+)$/iu.exec(
        normalized,
      );

    if (!simple) {
      return null;
    }

    const remainder =
      simple[1].trim();

    const known =
      matchConstructionAction(remainder);

    if (known) {
      return known;
    }

    return {
      action: "none",
      confidence: 0,
      response: "",
      sentiment: "positive",
      addressedToNubi: true,
      unknownConstructionTerm:
        extractUnknownConstructionTerm(
          remainder,
        ),
    };
  }

  const remainder =
    construction[1].trim();

  const known =
    matchConstructionAction(remainder);

  if (known) {
    return known;
  }

  return {
    action: "none",
    confidence: 0,
    response: "",
    sentiment: "positive",
    addressedToNubi: true,
    unknownConstructionTerm:
      extractUnknownConstructionTerm(
        remainder,
      ),
  };
}

function extractUnknownConstructionTerm(
  remainder: string,
): string {
  /*
   * No intentamos adivinar qué significa.
   *
   * Conservamos la expresión completa porque el contexto
   * puede ser importante para Gemini.
   *
   * Ejemplo:
   * "te quiero hacer whdlahwkdksks"
   *
   * se conserva como:
   * "hacer whdlahwkdksks"
   */
  return remainder.trim();
}

function matchConstructionAction(
  remainder: string,
): ChatInterpretation | null {
  for (const construction of constructionActions) {
    for (const word of construction.words) {
      if (
        remainder === word ||
        remainder.startsWith(`${word} `)
      ) {
        return {
          action: construction.action,
          confidence: 1,
          response: construction.response,
          sentiment: "positive",
          addressedToNubi: true,
        };
      }
    }
  }

  return null;
}

export function interpretComment(text: string): ChatInterpretation {
  const normalized = normalize(text);

  /*
   * ==========================================================
   * INTELIGENCIA SOCIAL
   * ==========================================================
   *
   * Estas expresiones no son órdenes para Nubi.
   * Son preguntas/declaraciones sobre la relación,
   * la presencia y la ausencia del espectador.
   *
   * Se resuelven localmente antes de Gemini.
   */

  if (
    /(?:^|\s)(?:me\s+)?(?:extrañaste|extranaste|echaste\s+de\s+menos)(?:\s+tu)?(?:[?¿!¡.]*)$/iu.test(
      normalized,
    ) ||
    /(?:^|\s)te\s+hice\s+falta(?:[?¿!¡.]*)$/iu.test(
      normalized,
    ) ||
    /(?:^|\s)me\s+estabas\s+esperando(?:[?¿!¡.]*)$/iu.test(
      normalized,
    )
  ) {
    return {
      action: "greet",
      confidence: 1,
      response: "",
      sentiment: "positive",
      addressedToNubi: true,
      socialIntent: "missing_me",
    };
  }

  if (
    /(?:^|\s)notaste\s+(?:que\s+)?me\s+fui(?:\s*[?¿!¡.]*)$/iu.test(
      normalized,
    ) ||
    /(?:^|\s)notaste\s+que\s+no\s+estaba(?:\s*[?¿!¡.]*)$/iu.test(
      normalized,
    ) ||
    /(?:^|\s)te\s+diste\s+cuenta\s+(?:de\s+)?que\s+me\s+fui(?:\s*[?¿!¡.]*)$/iu.test(
      normalized,
    ) ||
    /(?:^|\s)notaste\s+mi\s+ausencia(?:\s*[?¿!¡.]*)$/iu.test(
      normalized,
    )
  ) {
    return {
      action: "greet",
      confidence: 1,
      response: "",
      sentiment: "positive",
      addressedToNubi: true,
      socialIntent: "noticed_absence",
    };
  }

  if (
    /(?:^|\\s)(?:volvi|ya\\s+regrese|regrese|estoy\\s+de\\s+vuelta|ya\\s+estoy\\s+aqui|ya\\s+regrese)(?:[?¿!¡.]*)$/iu.test(
      normalized,
    )
  ) {
    return {
      action: "greet",
      confidence: 1,
      response: "",
      sentiment: "positive",
      addressedToNubi: true,
      socialIntent: "returned",
    };
  }

  /*
   * Las construcciones lingüísticas tienen prioridad.
   * Así "te quiero comer" no termina interpretándose
   * simplemente como "te quiero".
   */
  const construction =
    interpretConstruction(normalized);

  if (construction) {
    return construction;
  }

  /*
   * "te quiero" sin una acción posterior expresa cariño.
   */
  if (
    /(?:^|\s)(?:yo\s+)?te\s+quiero(?:\s*[❤️💕💖💗💓💞🥰]+)?$/iu.test(
      normalized,
    )
  ) {
    return {
      action: "pet",
      confidence: 1,
      response: "Nubi siente todo ese amor 🥹❤️",
      sentiment: "positive",
      addressedToNubi: true,
    };
  }

  for (const pattern of patterns) {
    for (const word of pattern.words) {
      const normalizedWord = normalize(word);

      /*
       * Las frases completas pueden aparecer dentro del comentario.
       * Las palabras individuales deben coincidir como palabras
       * reales, no como fragmentos de otras palabras.
       *
       * Ejemplo:
       * "ñam"  → coincide
       * "ñambrú" → NO coincide
       * "come" → coincide
       * "comer" → NO depende de un fragmento accidental
       */
      const matches =
        normalizedWord.includes(" ")
          ? normalized.includes(normalizedWord)
          : new RegExp(
              `(?:^|\\s|[^\\p{L}\\p{N}])${normalizedWord.replace(
                /[.*+?^${}()|[\\]\\]/g,
                "\\$&",
              )}(?=$|\\s|[^\\p{L}\\p{N}])`,
              "iu",
            ).test(normalized);

      if (matches) {
        return {
          action: pattern.action,
          confidence: 1,
          response: pattern.response,
        };
      }
    }
  }

  return {
    action: "none",
    confidence: 0,
    response: "",
  };
}
