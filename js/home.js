// Home page: builds the topic cards and stats from the exercise data, so they never drift from the content.
import { LANGS } from "./content.js";

const $ = id => document.getElementById(id);

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

async function main() {
  const index = await (await fetch("content/index.json")).json();
  const exercises = (await Promise.all(index.exercises.map(async id => {
    try { return { id, ...(await (await fetch(`content/exercises/${id}/exercise.json`)).json()) }; }
    catch { return null; }
  }))).filter(Boolean);

  const cards = index.topics.map(topic => {
    const list = exercises.filter(ex => ex.topic === topic.id);
    if (!list.length) return null;
    const langs = Object.keys(LANGS).filter(l => list.some(ex => ex.files?.[l])).map(l => LANGS[l].name);
    const levels = [...new Set(list.map(ex => ex.level))].join(", ");
    return el("a", { class: "card topic-card", href: `practice.html#${list[0].id}` },
      el("h3", null, topic.name),
      el("p", null, topic.description || ""),
      el("p", { class: "meta" }, `${list.length} exercise${list.length > 1 ? "s" : ""} · ${langs.join(" & ")} · ${levels}`));
  }).filter(Boolean);
  $("topicCards").replaceChildren(...cards);

  const variants = exercises.reduce((n, ex) => n + Object.keys(ex.files || {}).length, 0);
  $("stats").textContent = `${exercises.length} exercises · ${cards.length} topics · ${variants} Java & Kotlin versions`;
}

main().catch(() => {
  $("topicCards").replaceChildren(el("p", { class: "hint" }, "Couldn't load topics. Open the practice page to browse them."));
});
