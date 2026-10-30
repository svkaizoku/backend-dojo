// Checks every exercise: format, topic, files, and that each answer-key anchor matches exactly one code line.
// Usage: node scripts/validate.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkExercise, buildVariant } from "../js/content.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const errors = [];
const index = JSON.parse(readFileSync(join(root, "index.json"), "utf8"));
const topicIds = index.topics.map(t => t.id);

const dirs = readdirSync(join(root, "exercises"), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
for (const d of dirs) if (!index.exercises.includes(d)) errors.push(`${d}: folder exists but is not listed in content/index.json`);
if (new Set(index.exercises).size !== index.exercises.length) errors.push("content/index.json lists an exercise twice");
for (const kit of index.kits || []) {
  for (const step of kit.steps || []) {
    for (const id of step.exercises || []) {
      if (!index.exercises.includes(id)) errors.push(`kit "${kit.id}", step "${step.name}": unknown exercise "${id}"`);
    }
  }
}

let variants = 0;
for (const id of index.exercises) {
  const dir = join(root, "exercises", id);
  const file = join(dir, "exercise.json");
  if (!existsSync(file)) { errors.push(`${id}: missing exercise.json`); continue; }
  let ex;
  try { ex = JSON.parse(readFileSync(file, "utf8")); } catch (e) { errors.push(`${id}: exercise.json is not valid JSON (${e.message})`); continue; }
  const found = checkExercise(id, ex, topicIds);
  errors.push(...found);
  if (found.length) continue;
  if (!ex.files) {
    errors.push(...buildVariant(id, ex, null, null).errors);
    variants++;
    continue;
  }
  for (const [lang, name] of Object.entries(ex.files)) {
    const codePath = join(dir, name);
    if (!existsSync(codePath)) { errors.push(`${id}: missing code file ${name}`); continue; }
    for (const extra of ["tests", "solution"]) {
      const file = ex[extra]?.[lang];
      if (file && !existsSync(join(dir, file))) errors.push(`${id}: missing ${extra} file ${file}`);
    }
    errors.push(...buildVariant(id, ex, lang, readFileSync(codePath, "utf8")).errors);
    variants++;
  }
}


// Companies: the index lists each company file, and every link is https.
const companiesDir = join(root, "companies");
const companiesIndex = JSON.parse(readFileSync(join(companiesDir, "index.json"), "utf8"));
for (const c of companiesIndex.companies) {
  const file = join(companiesDir, `${c.id}.json`);
  if (!existsSync(file)) { errors.push(`company ${c.id}: missing ${c.id}.json`); continue; }
  const data = JSON.parse(readFileSync(file, "utf8"));
  for (const field of ["name", "summary", "updated", "confidence"]) if (!data[field]) errors.push(`company ${c.id}: "${field}" is missing`);
  if (!Array.isArray(data.process) || !data.process.length) errors.push(`company ${c.id}: "process" must be a non-empty list`);
  if (!Array.isArray(data.questions) || !data.questions.length) errors.push(`company ${c.id}: "questions" must be a non-empty list`);
  for (const q of data.questions || []) if (!q.q || !q.a || !q.topic) errors.push(`company ${c.id}: each question needs "q", "a" and "topic"`);
  for (const l of data.links || []) if (!String(l.url).startsWith("https://")) errors.push(`company ${c.id}: link "${l.title}" must be https`);
}

if (errors.length) {
  console.error(errors.map(e => "✗ " + e).join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`✓ ${index.exercises.length} exercises, ${variants} versions, all valid.`);
