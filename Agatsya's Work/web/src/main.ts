// main.ts
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./counter";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  const container = document.createElement("div");

  // Logos
  const viteLink = document.createElement("a");
  viteLink.href = "https://vite.dev";
  viteLink.target = "_blank";

  const viteImg = document.createElement("img");
  viteImg.src = viteLogo;
  viteImg.alt = "Vite logo";
  viteImg.className = "logo";
  viteLink.appendChild(viteImg);

  const tsLink = document.createElement("a");
  tsLink.href = "https://www.typescriptlang.org/";
  tsLink.target = "_blank";

  const tsImg = document.createElement("img");
  tsImg.src = typescriptLogo;
  tsImg.alt = "TypeScript logo";
  tsImg.className = "logo vanilla";
  tsLink.appendChild(tsImg);

  // Heading
  const heading = document.createElement("h1");
  heading.textContent = "Vite + TypeScript";

  // Counter card
  const card = document.createElement("div");
  card.className = "card";

  const button = document.createElement("button");
  button.id = "counter";
  button.type = "button";
  card.appendChild(button);

  // Paragraph
  const para = document.createElement("p");
  para.className = "read-the-docs";
  para.textContent = "Click on the Vite and TypeScript logos to learn more";

  // Append all
  container.append(viteLink, tsLink, heading, card, para);
  app.appendChild(container);

  // Setup counter
  setupCounter(button);
}
