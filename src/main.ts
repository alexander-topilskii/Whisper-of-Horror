import { GameLayout } from "../widgets/game-layout/game-layout";

const root = document.getElementById("app");

if (!root) {
  throw new Error("#app element not found");
}

new GameLayout(root);
