// Compiles and runs code without a server of our own.
// Kotlin: JetBrains' Kotlin Playground compiler service (free, public).
// Java: Judge0 CE, either the free public instance or the user's own RapidAPI key.
// Test files print one line per test: "PASS <name>" or "FAIL <name>: <message>".

export const JAVA_RUNNERS = {
  public: { name: "Judge0 public (free, rate-limited)", base: "https://ce.judge0.com" },
  rapidapi: { name: "Judge0 on RapidAPI (your key)", base: "https://judge0-ce.p.rapidapi.com" },
};
const JAVA_LANGUAGE_ID = 91; // Java (JDK 17) on Judge0 CE

export class RunError extends Error {
  constructor(message) { super(message); this.name = "RunError"; }
}

/* ---------- saved settings ---------- */
const SETTINGS_KEY = "dojo:runner";
export function loadRunnerSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (s && JAVA_RUNNERS[s.java]) return { java: s.java, rapidKey: String(s.rapidKey || "") };
  } catch {}
  return { java: "public", rapidKey: "" };
}
export function saveRunnerSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

/* ---------- shared ---------- */
// Joins the user's code and the test file into one program. Imports belong at the top of the
// user's file, so the test file must not have any.
export function program(code, tests) {
  return `${code.replace(/\s+$/, "")}\n\n${tests}`;
}

export function parseTests(stdout) {
  const tests = [];
  for (const line of stdout.split("\n")) {
    const m = line.match(/^(PASS|FAIL) ([^:]+?)(?::\s*(.*))?$/);
    if (m) tests.push({ name: m[2].trim(), pass: m[1] === "PASS", message: m[3] || "" });
  }
  return tests;
}

async function fetchJson(url, options, label) {
  let res;
  try { res = await fetch(url, options); }
  catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new RunError(`Couldn't reach ${label}. Check your connection and try again.`);
  }
  if (res.status === 429) throw new RunError(`${label} rate limit reached. Wait a minute and run again${label.includes("public") ? ", or use your own Judge0 key in Run settings" : ""}.`);
  if (res.status === 401 || res.status === 403) throw new RunError(`${label} rejected the request. Check your key in Run settings.`);
  if (!res.ok) throw new RunError(`${label} returned an error (${res.status}). Try again in a moment.`);
  return res.json();
}

/* ---------- Kotlin via JetBrains ---------- */
let kotlinVersion = null;
async function latestKotlin(signal) {
  if (!kotlinVersion) {
    const versions = await fetchJson("https://api.kotlinlang.org/versions", { signal }, "the Kotlin compiler service");
    kotlinVersion = (versions.find(v => v.latestStable) || versions[0]).version;
  }
  return kotlinVersion;
}

const unescapeHtml = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
function stream(text, tag) {
  const out = [];
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  let m;
  while ((m = re.exec(text))) out.push(unescapeHtml(m[1]));
  return out.join("");
}

async function runKotlin(source, signal) {
  const version = await latestKotlin(signal);
  const body = await fetchJson(`https://api.kotlinlang.org/api/${version}/compiler/run`, {
    method: "POST", signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ args: "", confType: "java", files: [{ name: "File.kt", text: source, publicId: "" }] }),
  }, "the Kotlin compiler service");
  const problems = Object.values(body.errors || {}).flat().filter(e => e.severity === "ERROR");
  const compileErrors = problems.map(e => `line ${(e.interval?.start?.line ?? 0) + 1}: ${e.message}`).join("\n");
  const stdout = stream(body.text || "", "outStream");
  let stderr = stream(body.text || "", "errStream");
  if (body.exception) stderr += `${stderr ? "\n" : ""}${body.exception.fullName || "Exception"}: ${body.exception.message || ""}`;
  return { compiled: !compileErrors, stdout, stderr, compileErrors, runner: `Kotlin ${version}` };
}

/* ---------- Java via Judge0 ---------- */
const toBase64 = s => { let b = ""; for (const byte of new TextEncoder().encode(s)) b += String.fromCharCode(byte); return btoa(b); };
const fromBase64 = s => (s ? new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))) : "");
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
});

async function runJava(source, settings, signal) {
  const runner = JAVA_RUNNERS[settings.java] || JAVA_RUNNERS.public;
  const label = runner.name;
  const headers = { "content-type": "application/json" };
  if (settings.java === "rapidapi") {
    if (!settings.rapidKey) throw new RunError("Add your RapidAPI key in Run settings, or switch to the public runner.");
    headers["x-rapidapi-key"] = settings.rapidKey;
    headers["x-rapidapi-host"] = "judge0-ce.p.rapidapi.com";
  }
  const created = await fetchJson(`${runner.base}/submissions?base64_encoded=true&wait=false`, {
    method: "POST", headers, signal,
    body: JSON.stringify({ language_id: JAVA_LANGUAGE_ID, source_code: toBase64(source) }),
  }, label);
  if (!created.token) throw new RunError(`${label} didn't accept the program. Try again.`);

  const fields = "status,stdout,stderr,compile_output,message";
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(attempt === 0 ? 800 : 1000, signal);
    const r = await fetchJson(`${runner.base}/submissions/${created.token}?base64_encoded=true&fields=${fields}`, { headers, signal }, label);
    const status = r.status?.id ?? 0;
    if (status <= 2) continue; // 1 in queue, 2 processing
    const compileErrors = status === 6 ? fromBase64(r.compile_output) || "Compilation failed." : "";
    let stderr = fromBase64(r.stderr);
    if (status === 5) stderr += `${stderr ? "\n" : ""}Time limit exceeded.`;
    else if (status >= 7 && !stderr) stderr = r.status?.description || fromBase64(r.message) || "Runtime error.";
    return { compiled: !compileErrors, stdout: fromBase64(r.stdout), stderr, compileErrors, runner: label };
  }
  throw new RunError(`${label} is taking too long. Try again in a moment.`);
}

// Runs a full program and returns { compiled, stdout, stderr, compileErrors, runner, tests }.
export async function run(lang, source, settings, signal) {
  const result = lang === "kotlin" ? await runKotlin(source, signal) : await runJava(source, settings, signal);
  return { ...result, tests: parseTests(result.stdout) };
}
