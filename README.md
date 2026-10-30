# Backend Dojo

Learn backend engineering by reviewing code. Backend Dojo drills the "review a teammate's pull request" interview round for Java and Kotlin roles.

Each exercise is a small, realistic pull request with planted problems. You write a review the way you would
on GitHub, then grade it:

- **Grade with AI**: an AI model compares your review with the answer key and scores how clearly you explain
  each problem. It runs on **your own AI account**, so you pay your provider directly and this project never
  pays for or sees your usage.
- **Quick check**: keyword matching, with no AI and no account needed.
- **Show answer key**: mark yourself.

Topics: concurrency and the JVM, Spring and transactions, databases and SQL, Kafka, Redis and caching,
money handling, and Kotlin-specific traps. Most exercises come in both Java and Kotlin, switchable at the top.

## Run it

It's a static site with no build step and no backend.

```sh
git clone <this repo>
cd <repo folder>
python3 -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` straight from disk doesn't work, because browsers block
loading the exercise files from `file://`.

Any static host works. On GitHub Pages: **Settings → Pages → Build and deployment → Deploy from a branch →
`main` / root**.

## Connect your AI

Click **Connect AI** at the top right and pick a provider:

| Provider | How you connect | Notes |
|---|---|---|
| OpenRouter | **Sign in with OpenRouter**, or paste a key | One account reaches Claude, GPT, Gemini and others. Pay-as-you-go credits. |
| Anthropic | Paste an API key from console.anthropic.com | Claude.ai subscriptions can't be used by third-party apps, so use an API key or OpenRouter. |
| OpenAI | Paste an API key from platform.openai.com | |
| Google Gemini | Paste an API key from aistudio.google.com | |

After connecting, pick a model from the list. One grade sends the exercise, the answer key and your review
in a single request.

### Where your key goes

- The key is stored only in your browser: for this tab only by default, or on this device if you tick
  **Remember on this device**. **Disconnect** deletes it.
- Requests go straight from your browser to the provider you chose. There is no server in between.
- The page's Content Security Policy only allows network calls to those four providers and loads no
  third-party scripts.
- Anyone with access to your browser profile can read a remembered key. Use a key with a spending limit,
  and don't tick **Remember** on a shared computer.

## Add an exercise

Each exercise is a folder in `content/exercises/<id>/`:

```
content/exercises/quote-cache/
  exercise.json      # title, PR description, answer key
  QuoteCache.java    # code under review (optional)
  QuoteCache.kt      # code under review (optional)
```

`exercise.json`:

```json
{
  "title": "Quote cache",
  "topic": "concurrency",
  "level": "Warm-up",
  "context": "What the PR says it does, and any facts the reviewer needs.",
  "files": { "java": "QuoteCache.java", "kotlin": "QuoteCache.kt" },
  "refs": [{ "title": "Optional further reading", "url": "https://…" }],
  "issues": [
    {
      "sev": "major",
      "title": "HashMap shared across threads",
      "at": { "java": "new HashMap<>()", "kotlin": "HashMap<String, Quote>()" },
      "why": "Why it matters.",
      "fix": "What to do instead.",
      "kw": ["thread-safe", "concurrenthashmap"]
    }
  ]
}
```

- `topic` is one of the ids in `content/index.json`. `level` is `Warm-up`, `Standard` or `Hard`.
- `sev` is `major` (must fix) or `minor` (should fix).
- `at` is a piece of text from the line the issue is on. It must match exactly one line in that language's
  file; the app works out the line number from it. Leave a language out of `at` if the issue only applies
  to the other one.
- `title`, `why` and `fix` can be one string, or `{ "java": "…", "kotlin": "…" }` when the wording differs.
- `kw` are lowercase phrases for Quick check. A review that contains any of them counts as found.

Then add the folder name to `exercises` in `content/index.json` and run:

```sh
node scripts/validate.mjs
```

CI runs the same check on every pull request.

**Write exercises yourself.** Don't paste code or text from books, courses or blogs unless their license
allows it. Ideas and bug patterns are fine to reuse; someone else's wording and code usually aren't. Link to
good sources in `refs` instead.

## License

- App code: [MIT](LICENSE).
- Exercises in `content/`: [CC BY 4.0](content/LICENSE.md).
