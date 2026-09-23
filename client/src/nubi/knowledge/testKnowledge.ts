import { createKnowledgeBase } from "./knowledgeBase";
import { findKnowledge } from "./knowledgeEngine";
import { learnKnowledge } from "./learning";

let knowledge = createKnowledgeBase();

console.log(
  "ANTES:",
  findKnowledge(knowledge, "jevi"),
);

const first =
  learnKnowledge(
    knowledge,
    "jevi",
    "algo que está bien o es bueno",
    "slang",
    "Carlos",
  );

knowledge = first.knowledgeBase;

console.log(
  "DESPUÉS DE APRENDER:",
  findKnowledge(knowledge, "jevi"),
);

const second =
  learnKnowledge(
    knowledge,
    "jevi",
    "algo que está bien o es bueno",
    "slang",
    "Pedro",
  );

knowledge = second.knowledgeBase;

console.log(
  "DESPUÉS DE CONFIRMAR:",
  findKnowledge(knowledge, "jevi"),
);
