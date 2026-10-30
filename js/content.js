// Exercise format and checks, shared by the app and scripts/validate.mjs. No DOM access here.

export const LANGS = {
  java: { name: "Java", ext: "java" },
  kotlin: { name: "Kotlin", ext: "kt" },
};

// What each practice mode needs. "code": the exercise ships code per language.
// "run": the user edits and runs the code against tests. "anchors": points are pinned to lines.
export const MODES = {
  review: { name: "Code review", short: "Review", code: true, run: false, anchors: "required",
    blurb: "Review a teammate's pull request and find the planted problems." },
  coding: { name: "Coding", short: "Coding", code: true, run: true, anchors: "none",
    blurb: "Implement a small backend component and make the tests pass." },
  debug: { name: "Debugging", short: "Debugging", code: true, run: true, anchors: "optional",
    blurb: "Find and fix the bugs until every test passes." },
  concepts: { name: "Concepts", short: "Concepts", code: false, run: false, anchors: "none",
    blurb: "Answer a common interview question in your own words." },
  design: { name: "System design", short: "Design", code: false, run: false, anchors: "none",
    blurb: "Sketch a design for a backend service and get it reviewed." },
};
export const LEVELS = ["Warm-up", "Standard", "Hard"];
const SEVERITIES = ["major", "minor"];

// A text field is either one string for every language or an object keyed by language.
export function pick(value, lang) {
  return typeof value === "string" ? value : value?.[lang];
}

const isText = v => typeof v === "string" && v.trim().length > 0;
const isFileName = v => typeof v === "string" && /^[\w.-]+$/.test(v);

// Returns a list of problems with one exercise.json. Empty list means it is valid.
export function checkExercise(id, ex, topicIds) {
  const errs = [];
  const fail = msg => errs.push(`${id}: ${msg}`);
  const mode = MODES[ex?.mode];
  if (!mode) {
    fail(`"mode" must be one of ${Object.keys(MODES).join(", ")}`);
    return errs;
  }
  for (const field of ["title", "context"]) if (!isText(ex[field])) fail(`"${field}" must be a non-empty string`);
  if (!topicIds.includes(ex.topic)) fail(`"topic" must be one of ${topicIds.join(", ")}`);
  if (!LEVELS.includes(ex.level)) fail(`"level" must be one of ${LEVELS.join(", ")}`);
  if (ex.answer !== undefined && !isText(ex.answer)) fail(`"answer" must be a non-empty string`);

  if (ex.refs !== undefined) {
    const ok = Array.isArray(ex.refs) && ex.refs.every(r => isText(r?.title) && typeof r?.url === "string" && r.url.startsWith("https://"));
    if (!ok) fail(`"refs" must be a list of { "title", "url" } with https links`);
  }

  // Code files: "files" is the code shown (or the starter code to edit); "tests" and "solution" pair with it.
  const langs = Object.keys(ex.files || {});
  if (mode.code) {
    if (!langs.length) fail(`"files" must name at least one code file`);
    for (const lang of langs) {
      if (!LANGS[lang]) fail(`"files" has unknown language "${lang}"`);
      if (!isFileName(ex.files[lang])) fail(`"files.${lang}" must be a plain file name`);
    }
    for (const field of ["tests", "solution"]) {
      const required = mode.run && (field === "tests" || ex.mode === "coding");
      if (ex[field] === undefined) { if (required) fail(`"${field}" is required in ${ex.mode} mode`); continue; }
      if (!mode.run) { fail(`"${field}" is only used in coding and debug modes`); continue; }
      const keys = Object.keys(ex[field] || {});
      if (keys.sort().join() !== [...langs].sort().join()) fail(`"${field}" must name a file for each language in "files"`);
      for (const lang of keys) if (!isFileName(ex[field][lang])) fail(`"${field}.${lang}" must be a plain file name`);
    }
  } else if (ex.files || ex.tests || ex.solution) {
    fail(`${ex.mode} mode has no code files; remove "files", "tests" and "solution"`);
  }

  if (!Array.isArray(ex.points) || !ex.points.length) {
    fail(`"points" must be a non-empty list`);
    return errs;
  }
  const textLangs = mode.code ? langs : [null];
  ex.points.forEach((point, i) => {
    const where = `point ${i + 1}`;
    if (!SEVERITIES.includes(point?.sev)) fail(`${where}: "sev" must be "major" or "minor"`);
    const anchorLangs = Object.keys(point?.at || {});
    if (mode.anchors === "required" && !anchorLangs.length) fail(`${where}: "at" must give an anchor for at least one language`);
    if (mode.anchors === "none" && anchorLangs.length) fail(`${where}: "at" isn't used in ${ex.mode} mode`);
    for (const lang of anchorLangs) {
      if (!langs.includes(lang)) fail(`${where}: "at.${lang}" but the exercise has no ${lang} file`);
      if (!isText(point.at[lang])) fail(`${where}: "at.${lang}" must be a non-empty string`);
    }
    // A point pinned to some languages only applies to those; otherwise it applies to all.
    const applies = anchorLangs.length ? anchorLangs : textLangs;
    for (const lang of applies) {
      for (const field of ["title", "why"]) if (!isText(pick(point?.[field], lang))) fail(`${where}: "${field}" is missing${lang ? " for " + lang : ""}`);
      if (point.fix !== undefined && !isText(pick(point.fix, lang))) fail(`${where}: "fix" is empty${lang ? " for " + lang : ""}`);
    }
    if ((ex.mode === "review" || ex.mode === "debug") && point.fix === undefined) fail(`${where}: "fix" is required in ${ex.mode} mode`);
    if (!Array.isArray(point?.kw) || !point.kw.length || point.kw.some(k => !isText(k))) {
      fail(`${where}: "kw" must be a non-empty list of keywords`);
    }
  });
  return errs;
}

// Builds what the app shows for one language (or null for modes without code): the code lines
// plus the answer-key points that apply, each with the line number found from its anchor.
// Every anchor must match exactly one line.
export function buildVariant(id, ex, lang, code) {
  const lines = code == null ? [] : code.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const errors = [];
  const points = [];
  ex.points.forEach((point, i) => {
    const anchors = point.at || {};
    if (Object.keys(anchors).length && anchors[lang] == null) return;
    let line = 0;
    const at = anchors[lang];
    if (at != null) {
      const hits = [];
      lines.forEach((text, n) => { if (text.includes(at)) hits.push(n + 1); });
      if (hits.length !== 1) errors.push(`${id} [${lang}] point ${i + 1}: anchor ${JSON.stringify(at)} matches ${hits.length} lines, needs exactly 1`);
      line = hits[0] ?? 0;
    }
    points.push({
      id: `${id}-${i + 1}`,
      sev: point.sev,
      title: pick(point.title, lang),
      why: pick(point.why, lang),
      fix: point.fix === undefined ? "" : pick(point.fix, lang),
      kw: point.kw.map(k => k.toLowerCase()),
      line,
    });
  });
  return {
    variant: {
      id, lang, mode: ex.mode, title: ex.title, topic: ex.topic, level: ex.level, context: ex.context,
      answer: ex.answer || "", file: lang ? ex.files[lang] : "", lines, points, refs: ex.refs || [],
      testsFile: lang && ex.tests ? ex.tests[lang] : "", solutionFile: lang && ex.solution ? ex.solution[lang] : "",
    },
    errors,
  };
}
