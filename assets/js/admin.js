import { bootPage, esc, sb, getSession, userIsAdmin, onAuthChange } from './core.js';
import { loadRoadmap, allSteps } from './progress.js';

const root = document.getElementById('admin-root');
const AI_LABELS = {
  none: ['No AI', 'var(--done)'],
  after_attempt: ['AI after attempt', 'var(--xp)'],
  before_attempt: ['AI before trying', 'var(--accent)'],
};
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function denied(message) {
  root.innerHTML = `<div class="empty"><h2>Admins only</h2><p>${message}</p></div>`;
}

function render(data, roadmap) {
  const steps = allSteps(roadmap);
  const byStep = new Map(data.steps.map(s => [s.step_id, s]));
  const maxStarted = Math.max(1, ...data.steps.map(s => s.started));
  const aiTotal = Object.values(data.ai_usage).reduce((a, b) => a + b, 0);
  const maxDay = Math.max(1, ...data.events_daily.map(d => d.events));

  root.innerHTML = `
    <section class="kpis" aria-label="Key numbers">
      <div class="kpi lead"><b>${data.users.total}</b><span>Players (${data.users.saved} saved accounts, ${data.users.guests} guests)</span></div>
      <div class="kpi"><b>${data.active_7d}</b><span>Active last 7 days</span></div>
      <div class="kpi"><b>${data.users.new_7d}</b><span>New last 7 days</span></div>
      <div class="kpi"><b>${data.avg_confidence ?? '–'}</b><span>Avg interview confidence (1-5)</span></div>
    </section>

    <section class="admin-section">
      <h2>How students use AI</h2>
      <p>Self-reported on every activity log. The goal is to grow the green and yellow share over time.</p>
      ${aiTotal ? `
        <div class="split" role="img" aria-label="AI usage split">
          ${Object.entries(AI_LABELS).map(([k, [, color]]) => `<i style="width:${pct(data.ai_usage[k] || 0, aiTotal)}%;background:${color}"></i>`).join('')}
        </div>
        <div class="legend">
          ${Object.entries(AI_LABELS).map(([k, [label, color]]) => `<span><i style="background:${color}"></i>${label}: ${data.ai_usage[k] || 0} (${pct(data.ai_usage[k] || 0, aiTotal)}%)</span>`).join('')}
        </div>` : '<p class="hint">No activity logs yet.</p>'}
    </section>

    <section class="admin-section">
      <h2>Step funnel</h2>
      <p>Started vs completed per step, in roadmap order. Steps with many starts and few completions need better instructions.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Step</th><th class="num">Started</th><th class="num">Done</th><th class="num">Skipped</th><th class="num">Logs</th><th class="num">Avg min</th><th>Progress</th></tr></thead>
          <tbody>
            ${steps.map(step => {
              const s = byStep.get(step.id) || { started: 0, done: 0, skipped: 0, activities: 0, avg_minutes: null };
              return `<tr>
                <td>${esc(step.title)}<br><span class="hint">${esc(step.level.title)}</span></td>
                <td class="num">${s.started}</td><td class="num">${s.done}</td><td class="num">${s.skipped}</td>
                <td class="num">${s.activities}</td><td class="num">${s.avg_minutes ?? '–'}</td>
                <td><div class="funnel-bar" title="${s.done} done of ${s.started} started">
                  <i class="d" style="width:${pct(s.done, maxStarted)}%"></i><i class="s" style="width:${pct(s.started - s.done, maxStarted)}%"></i>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="admin-section">
      <h2>Activity, last 14 days</h2>
      <p>Events per day (page views, opens, copies, logs).</p>
      ${data.events_daily.length ? `
        <div class="day-bars">
          ${data.events_daily.map(d => `<div title="${d.day}: ${d.events} events, ${d.users} players">
            <i style="height:${pct(d.events, maxDay)}%"></i><span>${new Date(d.day).getDate()}</span></div>`).join('')}
        </div>` : '<p class="hint">No events yet.</p>'}
    </section>

    <section class="admin-section">
      <h2>Most-copied prompts</h2>
      ${data.top_prompts.length ? `
        <table class="data-table"><thead><tr><th>Prompt</th><th class="num">Copies</th></tr></thead><tbody>
          ${data.top_prompts.map(p => `<tr><td><a href="library.html#p-${p.prompt_id}">${esc(p.title)}</a></td><td class="num">${p.copies}</td></tr>`).join('')}
        </tbody></table>` : '<p class="hint">No copies recorded yet.</p>'}
    </section>

    <section class="admin-section">
      <h2>Recent reflections</h2>
      <p>What students say the AI did differently. Read these to improve step instructions.</p>
      <div class="history">
        ${data.recent_reflections.length ? data.recent_reflections.map(r => {
          const step = steps.find(s => s.id === r.step_id);
          return `<div class="quote"><small>${esc(step?.title || r.step_id)} · ${esc(AI_LABELS[r.ai_usage]?.[0] || r.ai_usage)}${r.minutes != null ? ` · ${r.minutes} min` : ''}</small>${esc(r.reflection)}</div>`;
        }).join('') : '<p class="hint">No reflections yet.</p>'}
      </div>
    </section>`;
}

async function load() {
  if (!getSession()) return denied('Sign in with your admin account using the button at the top right.');
  if (!userIsAdmin()) return denied('This account is not an admin. Admin access is granted in the Supabase SQL editor.');
  root.innerHTML = '<div class="loading-state"><h2>Loading analytics…</h2></div>';
  const [roadmap, { data, error }] = await Promise.all([loadRoadmap(), sb.rpc('admin_overview')]);
  if (error) return denied(`Could not load analytics: ${esc(error.message)}`);
  render(data, roadmap);
}

await bootPage('admin');
onAuthChange(load);
load();
