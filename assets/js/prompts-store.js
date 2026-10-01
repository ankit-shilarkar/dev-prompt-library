import { sb } from './core.js';

// Stale-while-revalidate:
//   1. Serve whatever we already have instantly (browser cache, else the CDN snapshot).
//   2. Fetch the live database in the background.
//   3. If it changed, save it and tell the page to re-render.
// Layers, fastest first: localStorage → data/prompts.json (GitHub Pages CDN, refreshed nightly) → Supabase.

const CACHE_KEY = 'dpl.prompts.v1';
const COLUMNS = 'id,title,category,category_slug,purpose,icon,tag_label,tag_class,source,source_url,purpose_note,preview,prompt_text,chapter,examples';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(rows) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows })); } catch { /* storage full or blocked: cache is optional */ }
}

const normalise = rows => rows.map(p => ({ ...p, purpose: p.purpose || [], examples: Array.isArray(p.examples) ? p.examples : [] }));

async function fetchSnapshot() {
  const res = await fetch('data/prompts.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json.rows) || !json.rows.length) throw new Error('empty snapshot');
  return json.rows;
}

async function fetchLive() {
  const { data, error } = await sb.from('prompts').select(COLUMNS).order('id');
  if (error) throw error;
  return data;
}

let pending = null;

export function loadPrompts({ onUpdate } = {}) {
  if (pending) return pending;
  pending = (async () => {
    const cached = readCache();
    let rows = cached?.rows;
    let source = 'browser cache';

    if (!rows) {
      try { rows = await fetchSnapshot(); source = 'snapshot'; }
      catch {
        rows = await fetchLive();
        source = 'live';
        writeCache(rows);
        return { rows: normalise(rows), source };
      }
    }

    fetchLive().then(fresh => {
      const changed = JSON.stringify(fresh) !== JSON.stringify(rows);
      writeCache(fresh);
      if (changed && onUpdate) onUpdate(normalise(fresh));
    }).catch(err => console.warn('live refresh failed; showing cached prompts', err.message));

    return { rows: normalise(rows), source };
  })();
  return pending;
}
