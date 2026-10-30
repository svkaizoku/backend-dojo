// Companies tab: a list of companies, and a detail view per company (#<id>) with the interview process,
// topics, questions and links. Data comes from content/companies/.
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
const isHttps = u => typeof u === "string" && u.startsWith("https://");

async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function renderList(companies) {
  $("companyList").replaceChildren(...companies.map(c =>
    el("a", { class: "card company", href: `companies.html#${c.id}` },
      el("h3", null, c.name),
      el("p", { class: "hint" }, c.roles.join(" · ")),
      el("p", null, c.summary))));
}

function section(title, ...kids) {
  return el("section", { class: "company-section" }, el("h2", null, title), ...kids);
}

function showDetail(...nodes) {
  $("listView").hidden = true;
  $("detailView").hidden = false;
  $("detailView").replaceChildren(...nodes);
}

function renderCompany(c) {
  const parts = [
    el("p", { class: "eyebrow" }, el("a", { href: "companies.html" }, "← All companies")),
    el("h1", null, c.name),
    el("p", { class: "hint" }, c.roles.join(" · ")),
    el("p", { class: "lede" }, c.summary),
    el("p", { class: "hint" }, `Last updated ${c.updated}`),
    el("p", { class: "hint confidence" }, c.confidence),
    section("Interview process",
      el("ol", { class: "steps" }, c.process.map(s =>
        el("li", null,
          el("strong", null, s.stage),
          el("span", { class: "pill" }, s.confidence),
          el("p", null, s.format))))),
    section("Topics to prepare",
      el("dl", { class: "topic-list" }, c.topics.flatMap(t => [
        el("dt", null, t.name), el("dd", null, t.what)]))),
    section(`Questions reported (${c.questions.length})`,
      el("p", { class: "hint" }, "Answers are our own summaries. Try the question first, then open the answer."),
      c.questions.map(qa => el("details", { class: "qa" },
        el("summary", null, el("span", { class: "pill" }, qa.topic), " ", qa.q),
        el("p", null, qa.a)))),
    c.news?.length ? section("Latest news",
      el("p", { class: "hint" }, "Append-only: newest entries appear first. Added is when we recorded the item; Published is the date shown by the source."),
      el("div", { class: "news-wrap" },
        el("table", { class: "news-table" },
          el("thead", null, el("tr", null,
            el("th", null, "Added"), el("th", null, "Published"), el("th", null, "Headline"), el("th", null, "Source"), el("th", null, "Status"))),
          el("tbody", null, [...c.news].reverse().filter(n => isHttps(n.url)).map(n =>
            el("tr", null,
              el("td", null, n.added),
              el("td", null, n.published),
              el("td", null, el("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, n.title)),
              el("td", null, n.source),
              el("td", null, n.status)))))),
      el("p", { class: "hint" }, "More:"),
      el("ul", { class: "news-list" }, (c.news_sources || []).filter(n => isHttps(n.url)).map(n =>
        el("li", null, el("a", { href: n.url, target: "_blank", rel: "noopener noreferrer" }, n.title))))) : null,
    section("Links",
      el("ul", { class: "company-links" }, c.links.filter(l => isHttps(l.url)).map(l =>
        el("li", null,
          el("a", { href: l.url, target: "_blank", rel: "noopener noreferrer" }, l.title),
          el("span", { class: "hint" }, ` · ${l.kind} · checked: ${l.checked}`))))),
  ];
  if (c.notes?.length) parts.push(section("Notes", el("ul", null, c.notes.map(n => el("li", null, n)))));
  showDetail(...parts);
}

async function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  try {
    const index = await getJson("content/companies/index.json");
    if (!id) {
      document.title = "Companies · Backend Dojo";
      $("listView").hidden = false;
      $("detailView").hidden = true;
      renderList(index.companies);
      return;
    }
    const found = index.companies.find(c => c.id === id);
    if (!found) throw new Error("unknown company");
    const data = await getJson(`content/companies/${found.id}.json`);
    document.title = `${data.name} · Backend Dojo`;
    renderCompany(data);
    window.scrollTo(0, 0);
  } catch {
    showDetail(el("p", { class: "hint" }, "Couldn't load that company. ",
      el("a", { href: "companies.html" }, "Back to all companies.")));
  }
}

window.addEventListener("hashchange", route);
route();
