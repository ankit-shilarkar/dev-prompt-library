# Dev Prompt Library

> A gamified roadmap and prompt library that teaches college students to build **with** AI, not just prompt it.
> Attempt first, pair with AI, reflect, earn XP, and become job-ready.

**Live site →** [ankit-shilarkar.github.io/dev-prompt-library](https://ankit-shilarkar.github.io/dev-prompt-library)

*(Name and logo are placeholders while the brand is chosen. Both live in `assets/js/config.js`.)*

---

## Why this exists

Students can now generate code faster than they can understand it. That makes "vibe coders": people who ship what a chatbot wrote but can't explain, debug, or extend it. Employers hire the opposite: developers who use AI as a multiplier on their own thinking.

This site trains that habit with one loop, repeated across 24 steps:

1. **Attempt**: do the task yourself first and write down your approach.
2. **Pair**: use the step's linked prompts to get hints, reviews, or a second approach.
3. **Reflect**: write what the AI did differently and what you'll do next time.

XP rewards the loop, not the copy button: 50 for finishing a step, +25 for trying before using AI, +25 for a real reflection.

---

## What's inside

| Page | What it does |
|---|---|
| **Home** (`index.html`) | The pitch, the loop, and the 6-level path |
| **Roadmap** (`roadmap.html`) | Quest path of 6 levels × 4 steps; each step has a why, an activity with a deliverable, a try-first checklist, linked prompts, and an activity log |
| **Prompt library** (`library.html`) | 124 prompts with "when to use" notes and 3 worked examples each; filter by collection, purpose, and category |
| **Admin** (`admin.html`) | Learning analytics for the course owner: players, AI-usage split, step funnel, daily activity, most-copied prompts, recent reflections |

### The roadmap

| Level | Badge | Builds |
|---|---|---|
| 1 · Think Before You Prompt | Thinker | Restating problems, test cases first, assumptions, principles |
| 2 · Break It Down | Planner | Decomposition, planning, trade-offs, requirement checklists |
| 3 · Read & Understand Code | Reader | Code reading, data-flow tracing, deep concepts, DSA with hints |
| 4 · Debug Like a Scientist | Debugger | Hypotheses, error literacy, bug hunting, verifying AI answers |
| 5 · Build in Small Chunks | Builder | Tests, small commits/PRs, self-review, safe refactoring |
| 6 · Ship & Get Job-Ready | Shipper | Deployment, docs, system design, mock interviews |

Content lives in [`data/roadmap.json`](./data/roadmap.json). The format (levels → steps → detail panel, done / in progress / skipped) is inspired by [roadmap.sh](https://roadmap.sh); the content is original, because roadmap.sh's license doesn't allow republishing theirs.

### The prompt library

**124 prompts**, sourced and attributed:

| Source | Prompts |
|---|---|
| [The Complete Prompt Playbook](https://kunalganglani.com) by Kunal Ganglani | 97 |
| [@itsaiguide](https://www.instagram.com/itsaiguide) (Instagram) | 10 |
| [Anthropic Prompt Library](https://docs.anthropic.com/en/prompt-library) | 3 |
| X/Twitter community | 3 |
| Personal curation | 11 |

All 97 patterns from **The Complete Prompt Playbook — 100+ Battle-Tested Patterns for Developers Who Ship**
by **Kunal Ganglani | [kunalganglani.com](https://kunalganglani.com)**, Version 1.0 — March 2026, are credited to the author ("Share freely. Attribution appreciated."). Sections: Foundation, Reference, Pro Patterns, Daily Use.

---

## How it works

```
Browser (GitHub Pages, no build step)
 ├─ index / roadmap / library / admin .html
 ├─ assets/js  ── ES modules: config, core (auth, events, header), prompts-store (cache),
 │                 progress (XP rules), one module per page
 └─ data/      ── roadmap.json (content) + prompts.json (nightly snapshot)
        │
        ▼
Supabase (Postgres + Auth, free tier)
 ├─ prompts          public read
 ├─ profiles         own row; is_admin can't be self-granted
 ├─ step_progress    own rows only (RLS)
 ├─ activity_logs    own rows only (RLS)
 ├─ events           insert-only for students
 └─ admin_overview() aggregates, admins only
```

### Caching (free)

Prompts load with **stale-while-revalidate**, fastest layer first:

1. **Browser cache** (`localStorage`): repeat visits render instantly.
2. **Snapshot** (`data/prompts.json`): served by the GitHub Pages CDN. A GitHub Action ([`prompt-snapshot.yml`](./.github/workflows/prompt-snapshot.yml)) exports the table every night and commits only when prompts changed. This also keeps the site working if Supabase is slow or the free project is paused, and the daily request counts as project activity.
3. **Supabase**: fetched in the background; if anything changed, the page re-renders and the cache updates.

Run the snapshot by hand any time: **Actions → Refresh prompt snapshot → Run workflow**.

### Accounts and data

- **Guest first**: students start with Supabase anonymous sign-in, no form. They can later attach an email ("Save my progress") to keep progress across devices.
- **Collected**: step status, activity logs (attempt, minutes, when AI was used, prompts used, reflection, confidence), and usage events (page views, prompt opens/copies, step opens, submissions). Students see only their own data; Row Level Security enforces it in the database.
- **Admin**: only accounts with `profiles.is_admin = true` can open the analytics page or call `admin_overview()`.

---

## One-time Supabase setup

Do these in the [Supabase dashboard](https://supabase.com/dashboard/project/npqnunamefcptmmozuxj) for project `dev-prompt-library`:

1. **Enable guest sign-in**: Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins**.
2. **Set redirect URLs** (so email links return to the site): Authentication → URL Configuration
   - Site URL: `https://ankit-shilarkar.github.io/dev-prompt-library/`
   - Redirect URLs: `https://ankit-shilarkar.github.io/dev-prompt-library/**`
3. **Make yourself admin**: open the site, start as guest, click **Guest → Save my progress**, confirm the email. Then in the SQL Editor:
   ```sql
   UPDATE public.profiles SET is_admin = true
   WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
   ```
4. **Before a big launch**: the built-in email sender only allows a few emails per hour. Add free SMTP (e.g. Resend) under Authentication → Emails → SMTP, and consider enabling CAPTCHA for anonymous sign-ins to block bots.

---

## Editing content

- **Prompts**: Supabase Table Editor or SQL Editor (see [CONTRIBUTING.md](./CONTRIBUTING.md)). Pages pick up changes on the next load; the snapshot catches up overnight.
- **Roadmap**: edit `data/roadmap.json`. Step `prompts` are prompt IDs from the `prompts` table. Keep step `id`s stable; progress is stored against them.
- **Brand**: name, tagline, and logo in `assets/js/config.js`; colours and fonts in `assets/css/tokens.css`.

## Design

UI follows [impeccable](https://github.com/pbakaus/impeccable) design rules (tinted neutrals, no emoji icon systems, no same-size card grids, contrast and focus floors). Check changes with:

```bash
npx impeccable detect index.html roadmap.html library.html admin.html assets/css assets/js
```

## Repo structure

```
dev-prompt-library/
├── index.html · roadmap.html · library.html · admin.html
├── assets/css/tokens.css        ← brand + design tokens (light/dark)
├── assets/css/app.css           ← components and layouts
├── assets/js/                   ← config, core, prompts-store, progress, page modules
├── data/roadmap.json            ← roadmap content
├── data/prompts.json            ← nightly snapshot (generated)
├── supabase/migrations/         ← database schema, in order
├── .github/workflows/           ← prompt snapshot job
├── frontend-integration.md      ← template output for the monorepo scanner prompt
├── CONTRIBUTING.md · LICENSE
```

## Next up

- [ ] Brand name and logo
- [ ] Quiz gate per step (once activity data shows where students struggle)
- [ ] Google sign-in for saving progress
- [ ] Leaderboards and cohort views for colleges

## License

MIT — use freely, attribution appreciated. Prompt Playbook patterns © Kunal Ganglani, shared with attribution.

*Built by Ankit · Gurgaon, India*
