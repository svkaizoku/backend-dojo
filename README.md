# Backend Dojo

Free, open-source practice for backend engineering interviews, in Java and Kotlin.

**Live site:** https://svkaizoku.github.io/backend-dojo/

| Mode | What you do |
|---|---|
| Code review | Review a teammate's pull request and find the planted problems. |
| Coding | Implement a component in the editor and run it against tests. |
| Debugging | Fix failing code until every test passes. |
| Concepts | Answer a common interview question in your own words. |

Every exercise has an answer key: what matters, why, and the fix, plus a reference solution or model answer.
You can grade yourself, use the free keyword check, or have an AI grade your work. **Ask AI** is a chat panel
that sees the page you're on: the exercise, your code or answer, and your test results.

The home page is a dashboard: a guided **interview kit**, **skill badges** (stars earned from points), and a
filterable list of every challenge with its difficulty, points and your status. Progress is saved in your browser.

Topics: concurrency and the JVM, Spring and transactions, databases and SQL, Kafka, Redis and caching,
resilience, money handling, and Kotlin-specific traps.

## Run it locally

It's a static site with no build step and no backend.

```sh
git clone https://github.com/svkaizoku/backend-dojo.git
cd backend-dojo
python3 -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` straight from disk doesn't work, because browsers block
loading the exercise files from `file://`.

Any static host works. On GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

## Where things run

**AI (grading and Ask AI)** runs on your own account. Click **Connect AI** on the practice page:

| Provider | How you connect |
|---|---|
| OpenRouter | **Sign in with OpenRouter**, or paste a key. One account reaches Claude, GPT, Gemini and others. |
| Anthropic | Paste an API key. Claude.ai subscriptions can't be used by third-party apps. |
| OpenAI | Paste an API key. |
| Google Gemini | Paste an API key from Google AI Studio. |

**Code** runs on public compiler services, chosen under **Run settings**:

- **Kotlin:** JetBrains' Kotlin compiler service (the one behind play.kotlinlang.org). Free, no setup.
- **Java:** [Judge0 CE](https://judge0.com). Use the free public instance, which is shared and can hit its rate
  limit, or your own key from the free Basic plan of [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce).

### Privacy and keys

- Keys are stored only in your browser. AI keys are kept for the current tab unless you tick **Remember on
  this device**; **Disconnect** deletes them.
- Requests go straight from your browser to the service you chose. There is no server in between.
- Your code is sent to the code runner when you press **Run tests**.
- The pages' Content Security Policy only allows calls to those services and loads no third-party scripts.
- Anyone with access to your browser profile, including browser extensions, can read a stored key. Use keys
  with a spending limit, and don't tick **Remember** on a shared computer.

## Add an exercise

The full guide is at [svkaizoku.github.io/backend-dojo/contribute.html](https://svkaizoku.github.io/backend-dojo/contribute.html).
In short, each exercise is a folder in `content/exercises/<id>/` with an `exercise.json`:

```json
{
  "mode": "review",
  "title": "Quote cache",
  "topic": "concurrency",
  "level": "Warm-up",
  "context": "What the PR, task or question says, plus any facts the reader needs.",
  "files": { "java": "QuoteCache.java", "kotlin": "QuoteCache.kt" },
  "points": [
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

- `mode` is `review`, `coding`, `debug`, `concepts` or `design`.
- Coding and debug exercises also have `tests` and `solution` files per language. Test files print
  `PASS <name>` or `FAIL <name>: <message>` per test and have no imports.
- `at` (review and debug) is text from the point's line; it must match exactly one line.
- Concepts and design exercises have no code files and can add a model `answer`. Adapted material gets a `source` credit
  (title, https url, and a note on what changed); see `content/sources/javaguide/NOTICE.md` for the Apache-2.0 example.

Add the folder name to `exercises` in `content/index.json`, then run:

```sh
node scripts/validate.mjs           # format and answer-key anchors
node scripts/check-solutions.mjs    # runs coding/debug solutions and starters (needs JDK 17+ and network)
```

CI runs both on every pull request.

**Write exercises yourself.** Don't paste code or text from books, courses or blogs unless their license
allows it. Ideas and bug patterns are fine to reuse; link good sources in `refs`.

## License

- App code: [MIT](LICENSE).
- Exercises in `content/`: [CC BY 4.0](content/LICENSE.md).
- Fonts in `fonts/` (IBM Plex Sans, IBM Plex Mono, Space Grotesk): SIL Open Font License 1.1, see the `OFL-*.txt` files.
