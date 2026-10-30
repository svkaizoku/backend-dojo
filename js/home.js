// Home page: fills mode counts and topic cards from the exercise data, so they never drift from the content.
import { MODES } from "./content.js";

const $ = id => document.getElementById(id);

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function main() {
  const index = await (await fetch("content/index.json")).json();
  const exercises = (await Promise.all(index.exercises.map(async id => {
    try { return { id, ...(await (await fetch(`content/exercises/${id}/exercise.json`)).json()) }; }
    catch { return null; }
  }))).filter(Boolean);

  // Practice mode cells link straight to that mode's first exercise.
  for (const cell of document.querySelectorAll("[data-mode]")) {
    const list = exercises.filter(ex => ex.mode === cell.dataset.mode);
    if (!list.length) continue;
    cell.href = `practice.html#${list[0].id}`;
    cell.querySelector("[data-count]").textContent = `${plural(list.length, "exercise")} →`;
  }

  const cards = index.topics.map(topic => {
    const list = exercises.filter(ex => ex.topic === topic.id);
    if (!list.length) return null;
    const modes = [...new Set(list.map(ex => MODES[ex.mode]?.short).filter(Boolean))].join(" · ");
    return el("a", { class: "card topic-card", href: `practice.html#${list[0].id}` },
      el("h3", null, topic.name),
      el("p", null, topic.description || ""),
      el("p", { class: "meta" }, `${plural(list.length, "exercise")} · ${modes}`));
  }).filter(Boolean);
  $("topicCards").replaceChildren(...cards);
}

main().catch(() => {
  $("topicCards").replaceChildren(el("p", { class: "hint" }, "Couldn't load topics. Open the practice page to browse them."));
});
