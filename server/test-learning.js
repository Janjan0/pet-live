import "dotenv/config";
import { learnFromWeb } from "./learningAgent.js";

const result = await learnFromWeb({
  term: "mendigar",
  context: "Nubi, ¿qué significa mendigar?",
});

console.log(
  "\n🧠 LEARNING AGENT\n",
);

console.log(
  JSON.stringify(result, null, 2),
);

if (result.success) {
  console.log(
    "\n✅ Nubi consiguió conocimiento nuevo.",
  );
} else if (result.status === "quota") {
  console.log(
    "\n🟡 Gemini no tiene cuota disponible.",
  );
  console.log(
    "Nubi puede continuar funcionando sin aprendizaje web.",
  );
} else {
  console.log(
    "\n🔴 No fue posible aprender en esta ocasión.",
  );
}
