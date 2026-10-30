// Home dashboard: interview kit, skill badges and the challenge list, built from the exercise data
// and the progress the practice page saves in this browser.
import { MODES, LANGS, LEVELS, LEVEL_POINTS, SOLVED_AT } from "./content.js";

const $ = id => document.getElementById(id);
function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  node.append(...kids.flat().filter(k => k != null && k !== false));
  return node;
}
function bar(pct) {
  const fill = el("span");
  fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  return el("div", { class: "bar", role: "presentation" }, fill);
}
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const link = id => `practice.html#${id}`;

/* ---------- progress saved by the practice page ---------- */
function loadBest() {
  try {
    const best = JSON.parse(localStorage.getItem("dojo:progress:v1") || "null")?.best || {};
    const byId = {};
    for (const [key, pct] of Object.entries(best)) {
      const id = key.slice(0, key.indexOf(":"));
      if (typeof pct === "number") byId[id] = Math.max(byId[id] ?? 0, pct);
    }
    return byId;
  } catch { return {}; }
}

const best = loadBest();
const statusOf = ex => (best[ex.id] == null ? "new" : best[ex.id] >= SOLVED_AT ? "solved" : "attempted");
const pointsOf = ex => Math.round((LEVEL_POINTS[ex.level] * (best[ex.id] ?? 0)) / 100);
const maxPoints = list => list.reduce((n, ex) => n + LEVEL_POINTS[ex.level], 0);
const earned = list => list.reduce((n, ex) => n + pointsOf(ex), 0);
const starsFor = list => {
  const max = maxPoints(list);
  const pct = max ? (100 * earned(list)) / max : 0;
  const stars = Math.min(5, Math.floor(pct / 20));
  return stars === 0 && list.some(ex => statusOf(ex) === "solved") ? 1 : stars;
};
const nextUp = list => list.find(ex => statusOf(ex) !== "solved") || list[0];

function stars(n) {
  return el("span", { class: "stars", "aria-label": `${n} of 5 stars` },
    [0, 1, 2, 3, 4].map(i => el("span", { class: i < n ? "on" : "", "aria-hidden": "true" }, "★")));
}

/* ---------- sections ---------- */
function renderProgress(exercises, topics) {
  const max = maxPoints(exercises);
  const got = earned(exercises);
  const solved = exercises.filter(ex => statusOf(ex) === "solved").length;
  const attempted = exercises.filter(ex => statusOf(ex) !== "new").length;
  const totalStars = topics.reduce((n, t) => n + starsFor(exercises.filter(ex => ex.topic === t.id)), 0);
  $("scoreNum").textContent = String(got);
  $("scoreOf").textContent = `/ ${max} points`;
  $("scoreBar").style.width = `${max ? (100 * got) / max : 0}%`;
  $("solvedNum").textContent = `${solved} / ${exercises.length}`;
  $("attemptedNum").textContent = String(attempted);
  $("starsNum").textContent = `${totalStars} ★`;
  $("modeProgress").replaceChildren(...Object.entries(MODES).map(([id, m]) => {
    const list = exercises.filter(ex => ex.mode === id);
    if (!list.length) return null;
    const done = list.filter(ex => statusOf(ex) === "solved").length;
    return el("li", null,
      el("a", { href: link(nextUp(list).id) }, m.name),
      el("span", { class: "hint" }, `${done}/${list.length}`),
      bar((100 * done) / list.length));
  }).filter(Boolean));
  if (attempted) {
    $("heroCta").textContent = "Continue practising";
    $("heroCta").href = link(nextUp(exercises).id);
  }
}

function renderKit(kit, byId) {
  if (!kit) { $("kit").hidden = true; return; }
  const all = kit.steps.flatMap(s => s.exercises.map(id => byId[id]).filter(Boolean));
  const done = all.filter(ex => statusOf(ex) === "solved").length;
  $("kitName").textContent = kit.name;
  $("kitDesc").textContent = kit.description || "";
  $("kitBar").style.width = `${all.length ? (100 * done) / all.length : 0}%`;
  $("kitCount").textContent = `${done} of ${all.length} solved`;
  const next = nextUp(all);
  if (next) {
    $("kitContinue").href = link(next.id);
    $("kitContinue").textContent = done ? (done === all.length ? "Review the kit" : "Continue the kit") : "Start the kit";
  }
  $("kitSteps").replaceChildren(...kit.steps.map((step, i) => {
    const list = step.exercises.map(id => byId[id]).filter(Boolean);
    const stepDone = list.filter(ex => statusOf(ex) === "solved").length;
    return el("li", { class: "kit-step" + (stepDone === list.length && list.length ? " done" : "") },
      el("span", { class: "kit-num", "aria-hidden": "true" }, stepDone === list.length && list.length ? "✓" : String(i + 1)),
      el("div", { class: "kit-body" },
        el("div", { class: "kit-row" }, el("h3", null, step.name), el("span", { class: "hint" }, `${stepDone}/${list.length}`)),
        el("div", { class: "kit-items" }, list.map(ex =>
          el("a", { class: `kit-item ${statusOf(ex)}`, href: link(ex.id) },
            el("span", { class: "dot", "aria-hidden": "true" }),
            el("span", null, ex.title),
            el("span", { class: "kit-mode" }, MODES[ex.mode].short)))) ));
  }));
}

function renderSkills(exercises, topics) {
  $("skillCards").replaceChildren(...topics.map(t => {
    const list = exercises.filter(ex => ex.topic === t.id);
    if (!list.length) return null;
    const solved = list.filter(ex => statusOf(ex) === "solved").length;
    const max = maxPoints(list);
    return el("a", { class: "skill", href: link(nextUp(list).id) },
      el("div", { class: "skill-head" }, el("h3", null, t.name), stars(starsFor(list))),
      el("p", null, t.description || ""),
      bar(max ? (100 * earned(list)) / max : 0),
      el("p", { class: "skill-meta" }, `${solved}/${list.length} solved · ${earned(list)}/${max} pts`));
  }).filter(Boolean));
}

/* ---------- challenge explorer ---------- */
function renderFilters(topics) {
  $("modeFilter").append(...Object.entries(MODES).map(([id, m]) =>
    el("label", null, el("input", { type: "checkbox", name: "mode", value: id, checked: true }), ` ${m.name}`)));
  $("levelFilter").append(...LEVELS.map(level =>
    el("label", null, el("input", { type: "checkbox", name: "level", value: level, checked: true }), ` ${level}`)));
  $("topicFilter").append(...topics.map(t => el("option", { value: t.id }, t.name)));
}

function renderChallenges(exercises, topics) {
  const q = $("search").value.trim().toLowerCase();
  const status = document.querySelector('input[name="status"]:checked').value;
  const modes = new Set([...document.querySelectorAll('input[name="mode"]:checked')].map(i => i.value));
  const levels = new Set([...document.querySelectorAll('input[name="level"]:checked')].map(i => i.value));
  const topic = $("topicFilter").value;
  const shown = exercises.filter(ex =>
    modes.has(ex.mode) && levels.has(ex.level) && (!topic || ex.topic === topic) &&
    (status === "all" || (status === "solved") === (statusOf(ex) === "solved")) &&
    (!q || `${ex.title} ${ex.context}`.toLowerCase().includes(q)));
  $("resultCount").textContent = `${plural(shown.length, "challenge")}`;
  $("challengeList").replaceChildren(...(shown.length ? shown.map(ex => {
    const s = statusOf(ex);
    const langs = Object.keys(ex.files || {}).map(l => LANGS[l].name).join(", ");
    const topicName = topics.find(t => t.id === ex.topic)?.name || ex.topic;
    return el("li", { class: "ch" },
      el("div", { class: "ch-main" },
        el("a", { class: "ch-title", href: link(ex.id) }, ex.title),
        el("p", { class: "ch-meta" }, [MODES[ex.mode].name, topicName, langs].filter(Boolean).join(" · "))),
      el("div", { class: "ch-facts" },
        el("span", { class: `pill lvl-${LEVELS.indexOf(ex.level)}` }, ex.level),
        el("span", { class: "ch-pts" }, `${LEVEL_POINTS[ex.level]} pts`),
        el("span", { class: `ch-status ${s}` }, s === "solved" ? "Solved ✓" : s === "attempted" ? `Best ${best[ex.id]}%` : "")),
      el("a", { class: "btn" + (s === "solved" ? "" : " primary"), href: link(ex.id) }, s === "solved" ? "Retry" : s === "attempted" ? "Continue" : "Solve"));
  }) : [el("li", { class: "hint" }, "No challenges match these filters.")]));
}

/* ---------- load ---------- */
async function main() {
  const index = await (await fetch("content/index.json")).json();
  const exercises = (await Promise.all(index.exercises.map(async id => {
    try { return { id, ...(await (await fetch(`content/exercises/${id}/exercise.json`)).json()) }; }
    catch { return null; }
  }))).filter(ex => ex && MODES[ex.mode] && LEVEL_POINTS[ex.level]);
  const byId = Object.fromEntries(exercises.map(ex => [ex.id, ex]));
  const topics = index.topics;

  renderProgress(exercises, topics);
  renderKit(index.kits?.[0], byId);
  renderSkills(exercises, topics);
  renderFilters(topics);
  renderChallenges(exercises, topics);
  const rerender = () => renderChallenges(exercises, topics);
  $("search").addEventListener("input", rerender);
  document.querySelector(".filters").addEventListener("change", rerender);
}

main().catch(() => {
  $("skillCards").replaceChildren(el("p", { class: "hint" }, "Couldn't load the exercises. Open the practice page instead."));
});
