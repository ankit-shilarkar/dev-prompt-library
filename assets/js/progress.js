import { sb, getSession, setHeaderProgress } from './core.js';

// XP rewards the learning loop, not prompt copying:
//   finish a step            +step XP
//   tried before using AI    +tryFirstBonus
//   wrote a real reflection  +reflectionBonus
export const XP_PER_LEVEL = 200;
const MIN_REFLECTION = 40;

let roadmapPromise;
export function loadRoadmap() {
  roadmapPromise ??= fetch('data/roadmap.json').then(r => {
    if (!r.ok) throw new Error('Roadmap failed to load');
    return r.json();
  });
  return roadmapPromise;
}

export const allSteps = roadmap => roadmap.levels.flatMap(level => level.steps.map(step => ({ ...step, level })));

const cacheKey = uid => `dpl.progress.${uid}`;

export function cachedProgress() {
  const uid = getSession()?.user.id;
  if (!uid) return null;
  try { return JSON.parse(localStorage.getItem(cacheKey(uid))); } catch { return null; }
}

export async function loadProgress() {
  const session = getSession();
  if (!session) return { statuses: {}, logs: [] };
  const [p, l] = await Promise.all([
    sb.from('step_progress').select('step_id,status,updated_at'),
    sb.from('activity_logs').select('id,step_id,attempt,minutes,ai_usage,prompt_ids,reflection,confidence,created_at').order('created_at', { ascending: false }),
  ]);
  if (p.error) throw p.error;
  if (l.error) throw l.error;
  const progress = {
    statuses: Object.fromEntries(p.data.map(r => [r.step_id, { status: r.status, updated_at: r.updated_at }])),
    logs: l.data,
  };
  try { localStorage.setItem(cacheKey(session.user.id), JSON.stringify(progress)); } catch { /* optional */ }
  return progress;
}

export async function setStepStatus(stepId, status) {
  const { error } = await sb.from('step_progress').upsert(
    { user_id: getSession().user.id, step_id: stepId, status, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,step_id' });
  if (error) throw error;
}

export async function addActivityLog(entry) {
  const { error } = await sb.from('activity_logs').insert(entry);
  if (error) throw error;
}

export function stepXp(roadmap, stepId, progress) {
  const { step, tryFirstBonus, reflectionBonus } = roadmap.xp;
  const status = progress.statuses[stepId]?.status;
  const logs = progress.logs.filter(l => l.step_id === stepId);
  let xp = status === 'done' ? step : 0;
  if (logs.some(l => l.ai_usage !== 'before_attempt')) xp += tryFirstBonus;
  if (logs.some(l => (l.reflection || '').trim().length >= MIN_REFLECTION)) xp += reflectionBonus;
  return xp;
}

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function streakDays(progress) {
  const days = new Set([
    ...progress.logs.map(l => dayKey(l.created_at)),
    ...Object.values(progress.statuses).map(s => dayKey(s.updated_at)),
  ]);
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function summarize(roadmap, progress) {
  const steps = allSteps(roadmap);
  const xp = steps.reduce((sum, s) => sum + stepXp(roadmap, s.id, progress), 0);
  const { step, tryFirstBonus, reflectionBonus } = roadmap.xp;
  const maxXp = steps.length * (step + tryFirstBonus + reflectionBonus);
  const done = steps.filter(s => progress.statuses[s.id]?.status === 'done').length;
  const badges = roadmap.levels.map(level => ({
    name: level.badge,
    earned: level.steps.every(s => progress.statuses[s.id]?.status === 'done'),
  }));
  const tryFirstCount = progress.logs.filter(l => l.ai_usage !== 'before_attempt').length;
  return {
    xp,
    maxXp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelPct: Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100),
    toNext: XP_PER_LEVEL - (xp % XP_PER_LEVEL),
    done,
    total: steps.length,
    streak: streakDays(progress),
    badges,
    tryFirstRate: progress.logs.length ? Math.round((tryFirstCount / progress.logs.length) * 100) : null,
  };
}

// Fills the header XP chip on pages that don't otherwise need progress.
export async function syncHeaderProgress() {
  if (!getSession()) return null;
  const roadmap = await loadRoadmap();
  const cached = cachedProgress();
  if (cached) setHeaderProgress(summarize(roadmap, cached));
  const summary = summarize(roadmap, await loadProgress());
  setHeaderProgress(summary);
  return summary;
}
