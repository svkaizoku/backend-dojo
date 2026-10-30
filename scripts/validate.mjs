// Checks every exercise: format, topic, and that each issue's anchor matches exactly one code line.
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
  for (const [lang, name] of Object.entries(ex.files)) {
    const codePath = join(dir, name);
    if (!existsSync(codePath)) { errors.push(`${id}: missing code file ${name}`); continue; }
    errors.push(...buildVariant(id, ex, lang, readFileSync(codePath, "utf8")).errors);
    variants++;
  }
}

if (errors.length) {
  console.error(errors.map(e => "✗ " + e).join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`✓ ${index.exercises.length} exercises, ${variants} language versions, all valid.`);
