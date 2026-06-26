# Contributing to Dev Prompt Library

Thanks for wanting to contribute. This library grows by developers sharing prompts that actually work in real workflows — not generic ones you'd find anywhere.

---

## What makes a good prompt for this library

Before submitting, check your prompt against these:

- **It solves a real problem** — not a demo, not theoretical. You've run it and it helped.
- **It has a clear purpose** — someone reading the card should know in one sentence when to use it.
- **It produces consistent output** — same prompt, same type of result every time.
- **It's specific enough to be useful** — "act like a senior engineer" alone is too vague. The best prompts in this library constrain the role, the output format, and the scope.

---

## How to add a prompt

Open `dev_prompt_library.html` and add a new object to the `prompts` array in the `<script>` section.

Copy this template exactly:

```js
{
  id: 27,                           // next sequential number — check what the last id is
  category: "architecture",         // see categories below
  purpose: ["build", "plan"],       // see purposes below — can be multiple
  icon: "🧩",                       // one emoji that fits the prompt
  title: "Your prompt title",       // short, action-oriented — e.g. "Spring Boot API designer"
  tagLabel: "Architecture",         // matches category, title-cased
  tagClass: "badge-arch",           // see badge classes below
  source: "Where you found it",     // your name / Twitter / Instagram handle / "Personal curation"
  sourceUrl: "https://...",         // link to original source, or "" if original
  purposeNote: "When and why to use this. Be specific — mention the exact situation.",
  preview: "One sentence shown on the card before expanding.",
  text: `The full prompt text here.

Use backtick template literal so line breaks are preserved.
Put [PLACEHOLDERS] in square brackets where the user pastes their code or input.`
}
```

### Categories
| Value | Badge class | Use for |
|---|---|---|
| `architecture` | `badge-arch` | System design, scaffolding, refactoring, tech lead |
| `code-quality` | `badge-quality` | Auditing, debugging, performance, testing, code review |
| `devops` | `badge-devops` | CI/CD, deployment, security, infrastructure |
| `frontend` | `badge-frontend` | React, Expo, UI components, CSS, browser |
| `career` | `badge-career` | Interview prep, LinkedIn, career planning |
| `learning` | `badge-learning` | Concept explanations, DSA, mentoring |

### Purposes (can assign multiple)
| Value | When to use |
|---|---|
| `build` | Prompt helps you write or generate code |
| `review` | Prompt audits or evaluates existing code |
| `debug` | Prompt traces and fixes bugs |
| `learn` | Prompt explains or teaches a concept |
| `plan` | Prompt designs, architects, or plans before coding |
| `interview` | Prompt simulates or prepares for interviews |

---

## Prompt quality checklist before submitting

- [ ] `id` is the next sequential number (no gaps, no duplicates)
- [ ] `purposeNote` says *when* to use it, not just *what* it does
- [ ] `preview` is one sentence, no period at the end
- [ ] `text` has at least one `[PLACEHOLDER]` where the user pastes their input
- [ ] Source is credited — if you found it on X/Twitter/Instagram, link to the original
- [ ] You've actually run this prompt and it worked

---

## How to submit

1. Fork this repo
2. Add your prompt(s) to `dev_prompt_library.html`
3. Test locally — open the HTML file in a browser and check the card renders correctly
4. Open a PR with title: `Add: [prompt title]`
5. In the PR description, paste one example output the prompt produced

---

## Reporting a broken prompt

Open an issue with:
- The prompt title and id
- What you expected
- What you got instead
- Which model you used (Claude Sonnet / GPT-4o / etc.)

---

## Repo structure

```
dev-prompt-library/
├── index.html                  ← the prompt library (renamed from dev_prompt_library.html)
├── frontend-integration.md     ← template output file for the codebase scanner prompt
├── README.md
├── CONTRIBUTING.md             ← this file
├── LICENSE                     ← MIT
└── .gitignore
```

---

## Code style (for the HTML file)

- Keep all prompts in the `prompts` array — no separate files
- Do not change the CSS or JS logic unless fixing a bug
- Prompt text uses template literals — preserve all line breaks and indentation
- No minification — keep it readable

---

*This library is maintained by Ankit. PRs welcome.*
