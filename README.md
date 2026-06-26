# 🛠️ Dev Prompt Library

> A curated, source-attributed collection of AI prompts for software engineers.
> Every prompt is categorised, purpose-labelled, and comes with a "when to use" note.

**Live site →** [your-username.github.io/dev-prompt-library](https://your-username.github.io/dev-prompt-library)

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

**27 prompts** across 6 categories, sourced and attributed:

| Source | Prompts |
|---|---|
| [@itsaiguide](https://www.instagram.com/itsaiguide) (Instagram) | 10 |
| [Anthropic Prompt Library](https://docs.anthropic.com/en/prompt-library) | 3 |
| X/Twitter community | 3 |
| Personal curation | 10 |

### Categories

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

- 🔍 Search by title, keyword, or "when to use" note
- 🏷️ Filter by category and purpose
- 💡 Situation-specific "when to use" on every prompt
- 📋 One-click copy to clipboard
- ↗ Source attribution with links
- 📱 Mobile responsive

---

## How to host (GitHub Pages)

1. Fork this repo
2. Go to **Settings → Pages**
3. Source: `main` branch, `/ (root)`
4. Live at: `https://<your-username>.github.io/dev-prompt-library`

No build step. No dependencies. Pure HTML.

---

## How to add a prompt

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide. Quick version:

```js
{
  id: 27,
  category: "architecture",
  purpose: ["build", "plan"],
  icon: "🧩",
  title: "Your prompt title",
  tagLabel: "Architecture",
  tagClass: "badge-arch",
  source: "Your name or original source",
  sourceUrl: "https://link-to-original",
  purposeNote: "Use this when [specific situation]. Gets you [specific output].",
  preview: "One-line description shown on the card.",
  text: `Full prompt. Put [PLACEHOLDERS] where user pastes input.`
}
```

---

## Repo structure

```
dev-prompt-library/
├── index.html                  ← full prompt library (self-contained, zero dependencies)
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

MIT — use freely, attribution appreciated.

---

*Built by Ankit · Gurgaon, India · Targeting SDE-2 Java/Spring Boot*
