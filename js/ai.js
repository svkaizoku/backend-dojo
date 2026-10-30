// Bring-your-own AI: each user connects their own provider account. Calls go straight
// from the browser to that provider; this site has no server and never sees the key.

export const PROVIDERS = {
  openrouter: { name: "OpenRouter", keyUrl: "https://openrouter.ai/keys" },
  anthropic: { name: "Anthropic", keyUrl: "https://console.anthropic.com/settings/keys" },
  openai: { name: "OpenAI", keyUrl: "https://platform.openai.com/api-keys" },
  gemini: { name: "Google Gemini", keyUrl: "https://aistudio.google.com/apikey" },
};

export class AiError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

/* ---------- saved connection ---------- */
const CONN_KEY = "dojo:ai";
function storage(kind) {
  try { return kind === "local" ? window.localStorage : window.sessionStorage; } catch { return null; }
}
export function loadConnection() {
  for (const kind of ["local", "session"]) {
    try {
      const conn = JSON.parse(storage(kind)?.getItem(CONN_KEY) || "null");
      if (conn?.provider && conn?.key && PROVIDERS[conn.provider]) return { ...conn, remember: kind === "local" };
    } catch {}
  }
  return null;
}
export function saveConnection(conn) {
  clearConnection();
  const { provider, key, model, remember } = conn;
  try { storage(remember ? "local" : "session")?.setItem(CONN_KEY, JSON.stringify({ provider, key, model })); } catch {}
}
export function clearConnection() {
  for (const kind of ["local", "session"]) {
    try { storage(kind)?.removeItem(CONN_KEY); } catch {}
  }
}

/* ---------- HTTP ---------- */
async function request(provider, url, options) {
  const name = PROVIDERS[provider].name;
  let res;
  try {
    res = await fetch(url, { ...options, referrerPolicy: "no-referrer" });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new AiError("network", `Couldn't reach ${name}. Check your connection and try again.`);
  }
  if (res.ok) return res.json();
  let detail = "";
  try {
    const body = await res.json();
    detail = String(body?.error?.message || body?.message || "").slice(0, 200);
  } catch {}
  const suffix = detail ? ` (${detail})` : "";
  switch (res.status) {
    case 401: case 403: throw new AiError("auth", `${name} rejected the key. Check it and connect again.${suffix}`);
    case 402: throw new AiError("credits", `Your ${name} account is out of credits.${suffix}`);
    case 404: throw new AiError("model", `${name} doesn't know that model. Pick another one in Connect AI.${suffix}`);
    case 429: throw new AiError("rate", `${name} rate limit or quota reached. Wait a moment and try again.${suffix}`);
    default: throw new AiError("http", `${name} returned an error (${res.status}).${suffix}`);
  }
}

function headers(provider, key) {
  switch (provider) {
    case "anthropic":
      return {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      };
    case "gemini":
      return { "x-goog-api-key": key, "content-type": "application/json" };
    case "openrouter":
      return { authorization: `Bearer ${key}`, "content-type": "application/json", "x-title": "Backend Dojo" };
    default:
      return { authorization: `Bearer ${key}`, "content-type": "application/json" };
  }
}

/* ---------- models ---------- */
const NON_CHAT = /audio|realtime|tts|transcribe|image|embedding|moderation|search|whisper|dall-e|davinci|babbage|instruct|computer-use/i;

// Checks the key and returns the models it can use, best default first.
export async function listModels(provider, key) {
  const h = headers(provider, key);
  if (provider === "openrouter") {
    await request(provider, "https://openrouter.ai/api/v1/key", { headers: h });
    const body = await request(provider, "https://openrouter.ai/api/v1/models", { headers: h });
    const models = (body.data || []).sort((a, b) => (b.created || 0) - (a.created || 0)).map(m => m.id);
    return preferFirst(models, id => id.startsWith("anthropic/claude-opus"));
  }
  if (provider === "anthropic") {
    const body = await request(provider, "https://api.anthropic.com/v1/models?limit=1000", { headers: h });
    const models = (body.data || [])
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .map(m => m.id);
    return preferFirst(models, id => id === "claude-opus-5-5");
  }
  if (provider === "openai") {
    const body = await request(provider, "https://api.openai.com/v1/models", { headers: h });
    const models = (body.data || [])
      .filter(m => /^(gpt-|o\d)/.test(m.id) && !NON_CHAT.test(m.id))
      .sort((a, b) => (b.created || 0) - (a.created || 0))
      .map(m => m.id);
    return preferFirst(models, id => id.startsWith("gpt-"));
  }
  if (provider === "gemini") {
    const body = await request(provider, "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", { headers: h });
    const models = (body.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent") && /gemini/.test(m.name) && !NON_CHAT.test(m.name))
      .map(m => m.name.replace(/^models\//, ""))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    return preferFirst(models, id => /-pro\b/.test(id) && !/preview|exp|lite/.test(id));
  }
  throw new AiError("http", "Unknown provider.");
}

function preferFirst(models, isPreferred) {
  const i = models.findIndex(isPreferred);
  return i > 0 ? [models[i], ...models.slice(0, i), ...models.slice(i + 1)] : models;
}

/* ---------- completion ---------- */
// Sends one prompt and returns the reply text.
export async function complete(conn, prompt, signal) {
  const { provider, key, model } = conn;
  if (!model) throw new AiError("model", "Pick a model in Connect AI first.");
  const h = headers(provider, key);

  if (provider === "anthropic") {
    const body = await request(provider, "https://api.anthropic.com/v1/messages", {
      method: "POST", headers: h, signal,
      body: JSON.stringify({ model, max_tokens: 16000, messages: [{ role: "user", content: prompt }] }),
    });
    if (body.stop_reason === "refusal") throw new AiError("refused", "The model declined to grade this review.");
    return (body.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  }

  if (provider === "gemini") {
    const path = model.startsWith("models/") ? model : `models/${model}`;
    const body = await request(provider, `https://generativelanguage.googleapis.com/v1beta/${path}:generateContent`, {
      method: "POST", headers: h, signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    return (body.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  }

  // OpenAI and OpenRouter share the chat completions shape.
  const url = provider === "openai"
    ? "https://api.openai.com/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";
  const payload = { model, messages: [{ role: "user", content: prompt }] };
  if (provider === "openai") payload.response_format = { type: "json_object" };
  const body = await request(provider, url, { method: "POST", headers: h, signal, body: JSON.stringify(payload) });
  return body.choices?.[0]?.message?.content || "";
}

// Models sometimes wrap JSON in code fences or add a sentence around it.
export function parseJsonReply(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new AiError("invalid_json", "The model's grade came back in a shape the app couldn't read. Grade again.");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AiError("invalid_json", "The model's grade came back in a shape the app couldn't read. Grade again.");
  }
}

/* ---------- OpenRouter sign-in (OAuth PKCE, no server needed) ---------- */
const PKCE_KEY = "dojo:or-pkce";
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function callbackUrl() {
  return location.origin + location.pathname;
}

export async function startOpenRouterLogin(remember) {
  if (!window.isSecureContext || !crypto.subtle) {
    throw new AiError("insecure", "OpenRouter sign-in needs https or localhost. Paste a key instead.");
  }
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  try { sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, remember: !!remember })); } catch {
    throw new AiError("storage", "This browser blocked session storage, so sign-in can't finish. Paste a key instead.");
  }
  const url = new URL("https://openrouter.ai/auth");
  url.searchParams.set("callback_url", callbackUrl());
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  location.assign(url.toString());
}

// Call on page load. Returns null when this load is not an OpenRouter redirect.
export async function finishOpenRouterLogin() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  if (!code) return null;
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) || "null"); sessionStorage.removeItem(PKCE_KEY); } catch {}
  history.replaceState(null, "", callbackUrl() + location.hash);
  if (!saved) return null;
  // PKCE already binds the code to this tab's verifier; state is an extra check when echoed back.
  const returnedState = params.get("state");
  if (returnedState && returnedState !== saved.state) {
    throw new AiError("state", "OpenRouter sign-in didn't match this tab. Start it again from Connect AI.");
  }
  const body = await request("openrouter", "https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, code_verifier: saved.verifier, code_challenge_method: "S256" }),
  });
  if (!body?.key) throw new AiError("auth", "OpenRouter didn't return a key. Try signing in again.");
  return { provider: "openrouter", key: body.key, remember: saved.remember };
}
