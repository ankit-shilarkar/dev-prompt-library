# 🛠️ Dev Prompt Library

> A curated, source-attributed collection of AI prompts for software engineers.
> Every prompt is categorised, purpose-labelled, and comes with a "when to use" note.

**Live site →** [ankit-shilarkar.github.io/dev-prompt-library](https://ankit-shilarkar.github.io/dev-prompt-library)

---

## Why this exists

Most prompt lists are just dumps — no context on when to use them, no source credit, no explanation of what you'll actually get. This library fixes that.

Every prompt here has been run and tested. Each card tells you:
- **What category** it belongs to (architecture, code quality, DevOps, frontend, career, learning)
- **What purpose** it serves (build, review, debug, learn, plan, interview prep)
- **When exactly to use it** — a specific situation, not a vague description
- **Where it came from** — original source with link

---

## What's inside

**124 prompts** in two collections, sourced and attributed:

| Source | Prompts |
|---|---|
| [The Complete Prompt Playbook](https://kunalganglani.com) by Kunal Ganglani | 97 |
| [@itsaiguide](https://www.instagram.com/itsaiguide) (Instagram) | 10 |
| [Anthropic Prompt Library](https://docs.anthropic.com/en/prompt-library) | 3 |
| X/Twitter community | 3 |
| Personal curation | 11 |

### Prompt Playbook collection

All 97 patterns from **The Complete Prompt Playbook — 100+ Battle-Tested Patterns for Developers Who Ship**
by **Kunal Ganglani | [kunalganglani.com](https://kunalganglani.com)**, Version 1.0 — March 2026.
All credit for these patterns goes to the author ("Share freely. Attribution appreciated.").

Every pattern has its template, a "when to use" note (the book's Use when / Skip when / Pro tip), and
**3 worked examples** — the book's own example plus two more — each with a **Best for** line.

| Section | Chapters |
|---|---|
| Foundation | Foundation Patterns · Output Control · Reasoning & Accuracy · Agentic Patterns |
| Reference | Developer Workflow · Data & Analysis · Safety & Defense · Model-Specific Cheat Sheet |
| Pro Patterns | Anti-Hallucination · Output Quality Multipliers · Speed & Architecture · Production Hardening · Advanced Reasoning · Advanced Generation |
| Daily Use | Daily Coding · Daily Writing · Daily Research & Decisions · Daily DevOps |

### Original library categories

| Category | What's in it |
|---|---|
| 🏗️ Architecture | System design, backend scaffolding, clean refactoring, tech lead mode |
| 🔍 Code quality | Codebase audit, debugging, performance optimisation, code review, test generation |
| 🐳 DevOps & security | CI/CD setup, deployment, security audit, Azure Functions migration |
| 🎨 Frontend | React/Expo component systems, UI review, debugging, planning, interview prep |
| 💼 Career | SDE-2 mock interviews, LinkedIn optimisation, career gap analysis |
| 📚 Learning | Concept deep-dives, DSA mentoring, frontend fundamentals |

### Special prompt: Monorepo → `frontend-integration.md`

The standout prompt in this library. Point it at a React + Expo monorepo and it:
1. Reads the README and `/graphify` output for architecture context
2. Spawns 4 sub-agents in parallel (backend scanner, frontend scanner, config scanner, architecture analyser)
3. Synthesises everything into a single `frontend-integration.md`

The `.md` is a complete LLM context document — a PM or designer feeds it to any AI and gets a fully compatible UI with zero rework from the developer.

---

## Features

- 🔍 Search by title, keyword, "when to use" note, or example
- 🏷️ Filter by collection, category, and purpose
- 💡 Situation-specific "when to use" on every prompt
- 🧪 Worked examples with "Best for" guidance on every Playbook pattern
- 📋 One-click copy for prompts and examples
- ↗ Source attribution with links
- 📱 Mobile responsive

---

## How to host (GitHub Pages)

1. Fork this repo
2. Go to **Settings → Pages**
3. Source: `main` branch, `/ (root)`
4. Live at: `https://<your-username>.github.io/dev-prompt-library`

No build step. The page is a single HTML file; prompts are loaded at runtime from Supabase.

---

## Database (Supabase)

Prompts live in the `prompts` table of the Supabase project `dev-prompt-library`
(`https://npqnunamefcptmmozuxj.supabase.co`). The schema is in [`supabase/schema.sql`](./supabase/schema.sql).

- Row Level Security is on; the public (anon) role can only **read**.
- The key in `index.html` is the **publishable** key, which is safe to ship in a public page.
- Add or edit prompts in the Supabase dashboard (Table Editor or SQL Editor) — the site picks them up on the next page load, no redeploy needed.

---

## How to add a prompt

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide. Quick version (Supabase SQL Editor):

```sql
INSERT INTO prompts (title, category, category_slug, purpose, icon, tag_label, tag_class,
                     source, source_url, purpose_note, preview, prompt_text, chapter, examples)
VALUES (
  'Your prompt title', 'architecture', 'architecture', '{build,plan}', '🧩',
  'Architecture', 'badge-arch', 'Your name or original source', 'https://link-to-original',
  'Use this when [specific situation]. Gets you [specific output].',
  'One-line description shown on the card.',
  'Full prompt. Put [PLACEHOLDERS] where user pastes input.',
  'Original Library',
  '[{"title": "Example", "best_for": "When this is the right tool", "prompt": "Filled-in prompt"}]'
);
```

---

## Repo structure

```
dev-prompt-library/
├── index.html                  ← the prompt library UI (loads prompts from Supabase)
├── supabase/schema.sql         ← prompts table, RLS policy, indexes
├── frontend-integration.md     ← template output for the monorepo scanner prompt
├── README.md
├── CONTRIBUTING.md
├── LICENSE                     ← MIT
└── .gitignore
```

---

## Roadmap

- [ ] Prompt pack: Java/Spring Boot (annotations, JPA, Spring Security)
- [ ] Prompt pack: System design HLD + LLD
- [ ] Prompt pack: MongoDB aggregation pipelines
- [ ] Prompt pack: DSA patterns (sliding window, DP, graphs)
- [ ] Dark mode
- [ ] Export selected prompts as `.md`

---

## License

MIT — use freely, attribution appreciated. Prompt Playbook patterns © Kunal Ganglani, shared with attribution.

---

*Built by Ankit · Gurgaon, India · Targeting SDE-2 Java/Spring Boot*
