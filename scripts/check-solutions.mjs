// Runs every coding and debug exercise: the solution must pass all tests, and the starter code
// must compile and fail at least one test. Java runs locally (needs a JDK 17+ on PATH);
// Kotlin runs on JetBrains' Kotlin compiler service, so this needs network access.
// Usage: node scripts/check-solutions.mjs [exercise-id ...]
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { run, program, parseTests } from "../js/runner.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const index = JSON.parse(readFileSync(join(root, "index.json"), "utf8"));
const only = process.argv.slice(2);

function runJavaLocally(source) {
  const dir = mkdtempSync(join(tmpdir(), "dojo-java-"));
  try {
    writeFileSync(join(dir, "Main.java"), source);
    try {
      execFileSync("javac", ["--release", "17", "-d", dir, join(dir, "Main.java")], { stdio: "pipe" });
    } catch (e) {
      return { compiled: false, compileErrors: String(e.stderr || e.message), stdout: "", tests: [] };
    }
    const stdout = execFileSync("java", ["-cp", dir, "Main"], { encoding: "utf8", timeout: 20000 });
    return { compiled: true, compileErrors: "", stdout, tests: parseTests(stdout) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function execute(lang, source) {
  return lang === "java" ? runJavaLocally(source) : run(lang, source, {});
}

const problems = [];
let checked = 0;
for (const id of index.exercises) {
  if (only.length && !only.includes(id)) continue;
  const dir = join(root, "exercises", id);
  const ex = JSON.parse(readFileSync(join(dir, "exercise.json"), "utf8"));
  if (ex.mode !== "coding" && ex.mode !== "debug") continue;
  for (const lang of Object.keys(ex.files)) {
    const read = name => readFileSync(join(dir, name), "utf8");
    const tests = read(ex.tests[lang]);
    const label = `${id} [${lang}]`;

    if (ex.solution?.[lang]) {
      const r = await execute(lang, program(read(ex.solution[lang]), tests));
      const failed = r.tests.filter(t => !t.pass);
      if (!r.compiled) problems.push(`${label}: solution doesn't compile\n${r.compileErrors}`);
      else if (!r.tests.length) problems.push(`${label}: solution ran but printed no PASS/FAIL lines\n${r.stdout}${r.stderr || ""}`);
      else if (failed.length) problems.push(`${label}: solution fails ${failed.map(t => `"${t.name}" (${t.message})`).join(", ")}`);
    }

    const s = await execute(lang, program(read(ex.files[lang]), tests));
    if (!s.compiled) problems.push(`${label}: starter code doesn't compile\n${s.compileErrors}`);
    else if (!s.tests.some(t => !t.pass)) problems.push(`${label}: starter code already passes every test`);
    else console.log(`✓ ${label}: solution passes, starter fails ${s.tests.filter(t => !t.pass).length}/${s.tests.length}`);
    checked++;
  }
}

if (problems.length) {
  console.error("\n" + problems.map(p => "✗ " + p).join("\n"));
  process.exit(1);
}
console.log(`\n✓ ${checked} runnable exercise versions checked.`);
