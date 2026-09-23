import {
  createKnowledgeBase,
} from "./knowledgeBase";

import {
  resolveKnowledgeQuestion,
} from "./knowledgeResolver";

const knowledgeBase =
  createKnowledgeBase();

const comments = [
  'Nubi, ¿qué significa "amor"?',
  'Nubi, ¿qué significa mendigar?',
  'Nubi qué es jevi',
  '¿Qué es agua?',
  'te quiero Nubi ❤️',
  'Nubi come',
  'jajaja',
];

console.log("🧠 KNOWLEDGE RESOLVER TEST");
console.log("");

for (const comment of comments) {
  const result =
    resolveKnowledgeQuestion(
      knowledgeBase,
      comment,
    );

  console.log("💬", comment);
  console.log({
    isQuestion:
      result.question.isQuestion,
    term: result.term,
    found: result.found,
    meaning:
      result.knowledge?.meaning ?? null,
  });
  console.log("");
}
