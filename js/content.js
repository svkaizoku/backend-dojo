// Exercise format and checks, shared by the app and scripts/validate.mjs. No DOM access here.

export const LANGS = {
  java: { name: "Java" },
  kotlin: { name: "Kotlin" },
};
export const LEVELS = ["Warm-up", "Standard", "Hard"];
const SEVERITIES = ["major", "minor"];

// A text field is either one string for every language or an object keyed by language.
export function pick(value, lang) {
  return typeof value === "string" ? value : value?.[lang];
}

// Returns a list of problems with one exercise.json. Empty list means it is valid.
export function checkExercise(id, ex, topicIds) {
  const errs = [];
  const fail = msg => errs.push(`${id}: ${msg}`);
  for (const field of ["title", "context"]) {
    if (typeof ex?.[field] !== "string" || !ex[field].trim()) fail(`"${field}" must be a non-empty string`);
  }
  if (!topicIds.includes(ex?.topic)) fail(`"topic" must be one of ${topicIds.join(", ")}`);
  if (!LEVELS.includes(ex?.level)) fail(`"level" must be one of ${LEVELS.join(", ")}`);

  const langs = Object.keys(ex?.files || {});
  if (!langs.length) fail(`"files" must name at least one code file`);
  for (const lang of langs) {
    if (!LANGS[lang]) fail(`"files" has unknown language "${lang}"`);
    if (typeof ex.files[lang] !== "string" || !/^[\w.-]+$/.test(ex.files[lang])) fail(`"files.${lang}" must be a plain file name`);
  }

  if (ex?.refs !== undefined) {
    const ok = Array.isArray(ex.refs) && ex.refs.every(r =>
      typeof r?.title === "string" && r.title.trim() && typeof r?.url === "string" && r.url.startsWith("https://"));
    if (!ok) fail(`"refs" must be a list of { "title", "url" } with https links`);
  }

  if (!Array.isArray(ex?.issues) || !ex.issues.length) {
    fail(`"issues" must be a non-empty list`);
    return errs;
  }
  ex.issues.forEach((issue, i) => {
    const where = `issue ${i + 1}`;
    if (!SEVERITIES.includes(issue?.sev)) fail(`${where}: "sev" must be "major" or "minor"`);
    const issueLangs = Object.keys(issue?.at || {});
    if (!issueLangs.length) fail(`${where}: "at" must give an anchor for at least one language`);
    for (const lang of issueLangs) {
      if (!langs.includes(lang)) fail(`${where}: "at.${lang}" but the exercise has no ${lang} file`);
      if (typeof issue.at[lang] !== "string" || !issue.at[lang]) fail(`${where}: "at.${lang}" must be a non-empty string`);
      for (const field of ["title", "why", "fix"]) {
        const text = pick(issue?.[field], lang);
        if (typeof text !== "string" || !text.trim()) fail(`${where}: "${field}" is missing for ${lang}`);
      }
    }
    if (!Array.isArray(issue?.kw) || !issue.kw.length || issue.kw.some(k => typeof k !== "string" || !k.trim())) {
      fail(`${where}: "kw" must be a non-empty list of keywords`);
    }
  });
  return errs;
}

// Builds what the app shows for one language: code lines plus the issues that apply,
// each with the line number found from its anchor. Every anchor must match exactly one line.
export function buildVariant(id, ex, lang, code) {
  const lines = code.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const errors = [];
  const issues = [];
  ex.issues.forEach((issue, i) => {
    const at = issue.at?.[lang];
    if (at == null) return;
    const hits = [];
    lines.forEach((line, n) => { if (line.includes(at)) hits.push(n + 1); });
    if (hits.length !== 1) {
      errors.push(`${id} [${lang}] issue ${i + 1}: anchor ${JSON.stringify(at)} matches ${hits.length} lines, needs exactly 1`);
    }
    issues.push({
      id: `${id}-${i + 1}`,
      sev: issue.sev,
      title: pick(issue.title, lang),
      why: pick(issue.why, lang),
      fix: pick(issue.fix, lang),
      kw: issue.kw.map(k => k.toLowerCase()),
      line: hits[0] ?? 0,
    });
  });
  return {
    variant: {
      id, lang, title: ex.title, topic: ex.topic, level: ex.level, context: ex.context,
      file: ex.files[lang], lines, issues, refs: ex.refs || [],
    },
    errors,
  };
}
