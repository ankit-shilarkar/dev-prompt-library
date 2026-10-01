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

Prompts are stored in the Supabase `prompts` table (schema: [`supabase/migrations/001_prompts.sql`](./supabase/migrations/001_prompts.sql)), not in the HTML.
Maintainers add them in the Supabase SQL Editor; contributors can open an issue or PR containing the SQL below and a maintainer will run it.

```sql
INSERT INTO prompts (title, category, category_slug, purpose, icon, tag_label, tag_class,
                     source, source_url, purpose_note, preview, prompt_text, chapter, examples)
VALUES (
  'Your prompt title',             -- short, action-oriented — e.g. 'Spring Boot API designer'
  'architecture', 'architecture',  -- category + category_slug (see categories below)
  '{build,plan}',                  -- purposes (see below) — can be multiple
  '🧩',                            -- one emoji that fits the prompt
  'Architecture', 'badge-arch',    -- tag label + badge class (see below)
  'Where you found it',            -- your name / handle / 'Personal curation'
  'https://...',                   -- link to original source, or '' if original
  'When and why to use this. Be specific — mention the exact situation.',
  'One sentence shown on the card before expanding.',
  $$The full prompt text here.
Put [PLACEHOLDERS] in square brackets where the user pastes their code or input.$$,
  'Original Library',
  '[{"title": "Example title", "best_for": "The situation this example fits best", "prompt": "The prompt filled in for that situation"}]'
);
```

Use `$$ ... $$` quoting for long text so line breaks and apostrophes are preserved. The site picks up new rows on the next page load — no redeploy needed.

### Categories
| Value | Badge class | Use for |
|---|---|---|
| `architecture` | `badge-arch` | System design, scaffolding, refactoring, tech lead |
| `code-quality` | `badge-quality` | Auditing, debugging, performance, testing, code review |
| `devops` | `badge-devops` | CI/CD, deployment, security, infrastructure |
| `frontend` | `badge-frontend` | React, Expo, UI components, CSS, browser |
| `career` | `badge-career` | Interview prep, LinkedIn, career planning |
| `learning` | `badge-learning` | Concept explanations, DSA, mentoring |

Prompt Playbook chapters use their own slugs (`foundation`, `output-control`, … `daily-devops`) with the
badge classes `badge-foundation`, `badge-reference`, `badge-pro` and `badge-daily`. Category chips on the site
are built from whatever slugs exist in the table, so a new category needs no code change.

### Purposes (can assign multiple)
| Value | When to use |
|---|---|
| `build` | Prompt helps you write or generate code |
| `review` | Prompt audits or evaluates existing code |
| `debug` | Prompt traces and fixes bugs |
| `learn` | Prompt explains or teaches a concept |
| `plan` | Prompt designs, architects, or plans before coding |
| `write` | Prompt drafts docs, emails, updates, or posts |
| `interview` | Prompt simulates or prepares for interviews |

---

## Prompt quality checklist before submitting

- [ ] The title doesn't duplicate an existing prompt (ids are assigned by the database)
- [ ] `purpose_note` says *when* to use it, not just *what* it does
- [ ] `preview` is one sentence
- [ ] `prompt_text` has at least one `[PLACEHOLDER]` where the user pastes their input
- [ ] `examples` has 2-3 filled-in examples, each with a `best_for` situation
- [ ] Source is credited — if you found it on X/Twitter/Instagram, link to the original
- [ ] You've actually run this prompt and it worked

---

## How to submit

1. Open an issue (or a PR adding a `.sql` file under `supabase/contributions/`) titled `Add: [prompt title]`
2. Include the `INSERT` statement from above
3. Paste one example output the prompt produced
4. A maintainer reviews it, runs it in Supabase, and the card appears on the live site

---

## Reporting a broken prompt

Open an issue with:
- The prompt title and id
- What you expected
- What you got instead
- Which model you used (Claude Sonnet / GPT-4o / etc.)

---

## Adding or editing a roadmap step

Edit `data/roadmap.json`. Each step needs a stable `id` (progress is saved against it), a `why`, an `activity` with a `deliverable`, a `tryFirst` checklist the student does without AI, 1-3 `prompts` (prompt IDs), and `reflect` questions. Never rename an existing step `id`.

---

## Repo structure

```
dev-prompt-library/
├── index.html · roadmap.html · library.html · admin.html
├── assets/                     ← CSS tokens/components and JS modules
├── data/roadmap.json           ← roadmap content (levels → steps)
├── supabase/migrations/        ← database schema, in order
├── frontend-integration.md     ← template output file for the codebase scanner prompt
├── README.md
├── CONTRIBUTING.md             ← this file
├── LICENSE                     ← MIT
└── .gitignore
```

---

## Code style

- Prompts belong in the database, roadmap content in `data/roadmap.json`, never hardcoded in HTML
- Every value rendered into the page must go through `esc()` from `assets/js/core.js`
- Use the tokens in `assets/css/tokens.css` instead of raw colours
- Run `npx impeccable detect index.html roadmap.html library.html admin.html assets/css assets/js` before opening a PR
- No minification or build step: keep it readable

---

*This library is maintained by Ankit. PRs welcome.*
