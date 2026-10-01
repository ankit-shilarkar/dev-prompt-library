import { bootPage, esc, icons, getSession, onAuthChange, startGuest, setHeaderProgress, track, toast, copyText } from './core.js';
import { loadRoadmap, allSteps, loadProgress, cachedProgress, setStepStatus, addActivityLog, stepXp, summarize } from './progress.js';
import { loadPrompts } from './prompts-store.js';

const EMPTY = { statuses: {}, logs: [] };
const STATUS_LABEL = { in_progress: 'In progress', done: 'Completed', skipped: 'Skipped' };
const AI_USAGE = [
  ['none', "Didn't use AI"],
  ['after_attempt', 'Used AI after my attempt'],
  ['before_attempt', 'Used AI before trying'],
];
const MIN_ATTEMPT = 30;

let roadmap, steps, progress = EMPTY, currentId;
let promptsById = new Map();

const $ = id => document.getElementById(id);
const statusOf = id => progress.statuses[id]?.status;

function pickStartStep() {
  const fromHash = location.hash.slice(1);
  if (steps.some(s => s.id === fromHash)) return fromHash;
  return (steps.find(s => statusOf(s.id) !== 'done' && statusOf(s.id) !== 'skipped') || steps[0]).id;
}

function refreshSummary() {
  if (!getSession()) return null;
  const summary = summarize(roadmap, progress);
  setHeaderProgress(summary);
  return summary;
}

// ── Player bar / guest call-to-action ────────────────────
function renderPlayer() {
  const slot = $('player-slot');
  if (!getSession()) {
    slot.innerHTML = `
      <section class="guest-cta">
        <div>
          <h2>Start as a guest, no sign-up</h2>
          <p>You can read every step without an account. Start a guest session to log activities, earn XP and badges, and keep your streak. Add your email later to keep it forever.</p>
        </div>
        <button class="btn btn-primary" type="button" id="start-guest">Start my quest</button>
      </section>`;
    $('start-guest').onclick = beginGuest;
    return;
  }
  const s = refreshSummary();
  slot.innerHTML = `
    <section class="player" aria-label="Your progress">
      <div class="stat"><b>Lv ${s.level}</b><span>Player level</span></div>
      <div class="xp-track">
        <div class="bar"><i style="--fill:${s.levelPct / 100}"></i></div>
        <span>${s.xp} XP · ${s.toNext} XP to level ${s.level + 1}</span>
      </div>
      <div class="stat"><b>${s.done}/${s.total}</b><span>Steps done</span></div>
      <div class="stat"><b>${s.streak}</b><span>Day streak</span></div>
      <div class="stat"><b>${s.tryFirstRate ?? '–'}${s.tryFirstRate === null ? '' : '%'}</b><span>Tried first</span></div>
      <div class="badges" aria-label="Badges">
        ${s.badges.map(b => `<span class="badge-pill${b.earned ? ' earned' : ''}" title="${b.earned ? 'Earned' : 'Complete the level to earn'}">${esc(b.name)}</span>`).join('')}
      </div>
    </section>`;
}

async function beginGuest() {
  try {
    await startGuest();
    toast('Quest started. Your progress now saves automatically.');
  } catch (err) {
    toast(err.message);
  }
}

// ── Quest path ───────────────────────────────────────────
function renderPath() {
  $('quest-path').innerHTML = roadmap.levels.map((level, i) => {
    const done = level.steps.filter(s => statusOf(s.id) === 'done').length;
    return `
      <section class="quest-level">
        <h2>Level ${i + 1} · ${esc(level.title)} <small>${done}/${level.steps.length}</small></h2>
        <ol class="quest-steps">
          ${level.steps.map(step => {
            const status = statusOf(step.id) || 'todo';
            return `
              <li class="quest-step" data-status="${status}">
                <button type="button" data-step="${step.id}"${step.id === currentId ? ' aria-current="step"' : ''}>
                  <span class="node">${status === 'done' ? icons.check : ''}</span>
                  <span class="label">${esc(step.title)}
                    <span class="sub">${esc(step.skill)}${STATUS_LABEL[status] ? ` · ${STATUS_LABEL[status]}` : ''}</span>
                  </span>
                </button>
              </li>`;
          }).join('')}
        </ol>
      </section>`;
  }).join('');
}

// ── Step panel ───────────────────────────────────────────
const checklistKey = id => `dpl.checklist.${id}`;
function readChecklist(id) {
  try { return JSON.parse(localStorage.getItem(checklistKey(id))) || []; } catch { return []; }
}

function pairHtml(step) {
  return step.prompts.map(id => {
    const p = promptsById.get(id);
    if (!p) return '';
    return `
      <div class="pair-item">
        <h4>${esc(p.title)}</h4>
        <p>${esc(p.preview)}</p>
        <div class="actions">
          <button class="btn btn-small" type="button" data-copy="${id}">Copy prompt</button>
          <a class="btn btn-small btn-quiet" href="library.html#p-${id}">Examples</a>
        </div>
      </div>`;
  }).join('') || '<p class="hint">Loading prompts…</p>';
}

function logFormHtml(step) {
  if (!getSession()) {
    return `<div class="locked-note">Start a guest session to log this activity and earn XP. <button class="btn btn-small btn-primary" type="button" data-act="guest">Start my quest</button></div>`;
  }
  const choices = (name, opts, type = 'radio', required = false) => opts.map(([value, label], i) => `
    <label class="choice"><input type="${type}" name="${name}" value="${value}"${required && i === 0 ? ' required' : ''}><span>${esc(label)}</span></label>`).join('');
  const linked = step.prompts.map(id => [id, promptsById.get(id)?.title || `Prompt ${id}`]);
  const form = `
    <form class="log-form" id="log-form" novalidate>
      <div class="field">
        <label for="attempt">Your attempt <span class="hint">· what did you do before using AI? Rough is fine.</span></label>
        <textarea id="attempt" name="attempt" required minlength="${MIN_ATTEMPT}" maxlength="5000" placeholder="My approach was… I got stuck on…"></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="minutes">Minutes spent</label>
          <input id="minutes" name="minutes" type="number" min="0" max="600" inputmode="numeric" placeholder="30">
        </div>
      </div>
      <fieldset class="choice-group">
        <legend>Honestly, when did you use AI?</legend>
        ${choices('ai_usage', AI_USAGE, 'radio', true)}
      </fieldset>
      <fieldset class="choice-group">
        <legend>Prompts you used <span class="hint">(optional)</span></legend>
        ${choices('prompt_ids', linked, 'checkbox')}
      </fieldset>
      <div class="field">
        <label for="reflection">Reflect <span class="hint">· ${step.reflect.map(esc).join(' ')}</span></label>
        <textarea id="reflection" name="reflection" maxlength="5000" placeholder="The AI did … differently. Next time I will …"></textarea>
      </div>
      <fieldset class="choice-group">
        <legend>How confidently could you explain this in an interview?</legend>
        ${choices('confidence', [['1', '1 · not yet'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5 · easily']])}
      </fieldset>
      <p class="privacy-note">Saved to your account so you can review it later. The course admin sees answers in aggregate to improve the roadmap.</p>
      <div><button class="btn btn-primary" type="submit">Log activity &amp; complete step</button></div>
    </form>`;
  if (statusOf(step.id) !== 'done') return form;
  const next = steps[steps.findIndex(s => s.id === step.id) + 1];
  return `
    <div class="complete-note">
      <p><b>Step complete.</b> Nice work. Your attempt and reflection are saved below.</p>
      ${next ? `<button class="btn btn-primary btn-small" type="button" data-step="${next.id}">Next: ${esc(next.title)}</button>` : '<p>That was the final step. You finished the roadmap!</p>'}
    </div>
    <details class="again"><summary>Log another attempt</summary>${form}</details>`;
}

function historyHtml(step) {
  const logs = progress.logs.filter(l => l.step_id === step.id);
  if (!logs.length) return '';
  const usage = Object.fromEntries(AI_USAGE);
  return `
    <section class="panel-section">
      <h3>Your logs</h3>
      <div class="history">
        ${logs.map(l => `
          <div class="history-item">
            <span class="when">${new Date(l.created_at).toLocaleDateString()} · ${esc(usage[l.ai_usage])}${l.minutes != null ? ` · ${l.minutes} min` : ''}</span>
            <p><b>Attempt:</b> ${esc(l.attempt)}</p>
            ${l.reflection ? `<p><b>Reflection:</b> ${esc(l.reflection)}</p>` : ''}
          </div>`).join('')}
      </div>
    </section>`;
}

function renderPanel() {
  const step = steps.find(s => s.id === currentId);
  const levelIndex = roadmap.levels.indexOf(step.level) + 1;
  const status = statusOf(step.id);
  const checked = new Set(readChecklist(step.id));
  const maxXp = roadmap.xp.step + roadmap.xp.tryFirstBonus + roadmap.xp.reflectionBonus;
  const earned = getSession() ? stepXp(roadmap, step.id, progress) : 0;

  let controls = '';
  if (getSession()) {
    if (!status) controls = '<button class="btn btn-small" type="button" data-status="in_progress">Start this step</button>';
    if (status === 'in_progress') controls = '<button class="btn btn-small btn-quiet" type="button" data-status="skipped">Skip for now</button>';
    if (status === 'skipped') controls = '<button class="btn btn-small" type="button" data-status="in_progress">Resume</button>';
  }

  $('step-panel').innerHTML = `
    <p class="crumbs">Level ${levelIndex} · ${esc(step.level.title)} · ${esc(step.skill)}</p>
    <h2>${esc(step.title)}</h2>
    <p class="why">${esc(step.why)}</p>
    <div class="status-row">
      ${status ? `<span class="state ${status}">${STATUS_LABEL[status]}</span>` : ''}
      ${getSession() ? `<span class="state">${earned}/${maxXp} XP</span>` : ''}
      ${controls}
    </div>

    <section class="panel-section">
      <h3>Activity</h3>
      <div class="task">
        <p>${esc(step.activity.task)}</p>
        <p class="deliverable"><b>Deliverable:</b> ${esc(step.activity.deliverable)}</p>
      </div>
    </section>

    <section class="panel-section">
      <h3>Try it yourself first <span class="step-tag">no AI yet</span></h3>
      <ul class="checklist">
        ${step.tryFirst.map((item, i) => `
          <li><label><input type="checkbox" data-check="${i}"${checked.has(i) ? ' checked' : ''}><span>${esc(item)}</span></label></li>`).join('')}
      </ul>
    </section>

    <section class="panel-section">
      <h3>Pair with AI <span class="step-tag">after your attempt</span></h3>
      <div class="pair-list">${pairHtml(step)}</div>
    </section>

    <section class="panel-section">
      <h3>Log your activity <span class="step-tag">+${maxXp} XP</span></h3>
      ${logFormHtml(step)}
    </section>
    ${historyHtml(step)}`;
}

function renderAll() {
  renderPlayer();
  renderPath();
  renderPanel();
}

function selectStep(id, { scroll = false } = {}) {
  currentId = id;
  history.replaceState(null, '', `#${id}`);
  renderPath();
  renderPanel();
  if (getSession()) track('step_open', { step_id: id });
  if (scroll && matchMedia('(max-width: 900px)').matches) $('step-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function reloadProgress() {
  progress = getSession() ? await loadProgress() : EMPTY;
}

async function changeStatus(status) {
  try {
    await setStepStatus(currentId, status);
    track('step_status', { step_id: currentId, props: { status } });
    await reloadProgress();
    renderAll();
  } catch (err) {
    toast(`Could not update the step: ${err.message}`);
  }
}

async function submitLog(form) {
  const data = new FormData(form);
  const attempt = (data.get('attempt') || '').trim();
  if (attempt.length < MIN_ATTEMPT) {
    toast(`Write at least ${MIN_ATTEMPT} characters about your own attempt first.`);
    form.attempt.focus();
    return;
  }
  if (!data.get('ai_usage')) {
    toast('Tell us when you used AI. There is no wrong answer.');
    return;
  }
  const minutes = data.get('minutes') === '' ? null : Math.min(600, Math.max(0, Number(data.get('minutes'))));
  const entry = {
    step_id: currentId,
    attempt,
    minutes: Number.isFinite(minutes) ? minutes : null,
    ai_usage: data.get('ai_usage'),
    prompt_ids: data.getAll('prompt_ids').map(Number),
    reflection: (data.get('reflection') || '').trim() || null,
    confidence: data.get('confidence') ? Number(data.get('confidence')) : null,
  };
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  const before = summarize(roadmap, progress).xp;
  try {
    await addActivityLog(entry);
    await setStepStatus(currentId, 'done');
    track('activity_submit', { step_id: currentId, props: { ai_usage: entry.ai_usage, minutes: entry.minutes, confidence: entry.confidence } });
    await reloadProgress();
    const after = summarize(roadmap, progress);
    const gained = after.xp - before;
    renderAll();
    $('step-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(gained > 0 ? `+${gained} XP · step complete` : 'Activity logged', gained > 0 ? 'xp' : '');
  } catch (err) {
    button.disabled = false;
    toast(`Could not save: ${err.message}`);
  }
}

// ── Events ───────────────────────────────────────────────
document.addEventListener('click', async e => {
  const stepBtn = e.target.closest('[data-step]');
  if (stepBtn) return selectStep(stepBtn.dataset.step, { scroll: true });

  const statusBtn = e.target.closest('[data-status]');
  if (statusBtn) return changeStatus(statusBtn.dataset.status);

  const copyBtn = e.target.closest('[data-copy]');
  if (copyBtn) {
    const id = Number(copyBtn.dataset.copy);
    copyText(promptsById.get(id)?.prompt_text || '', copyBtn);
    if (getSession()) track('prompt_copy', { prompt_id: id, step_id: currentId });
    return;
  }

  if (e.target.closest('[data-act="guest"]')) beginGuest();
});

document.addEventListener('change', e => {
  const box = e.target.closest('[data-check]');
  if (!box) return;
  const list = [...document.querySelectorAll('[data-check]')].filter(b => b.checked).map(b => Number(b.dataset.check));
  try { localStorage.setItem(checklistKey(currentId), JSON.stringify(list)); } catch { /* optional */ }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'log-form') return;
  e.preventDefault();
  submitLog(e.target);
});

// ── Boot ─────────────────────────────────────────────────
try {
  await bootPage('roadmap');
  roadmap = await loadRoadmap();
  steps = allSteps(roadmap);
  progress = cachedProgress() || EMPTY;
  currentId = pickStartStep();
  renderAll();

  loadPrompts({ onUpdate: rows => { promptsById = new Map(rows.map(p => [p.id, p])); renderPanel(); } })
    .then(({ rows }) => { promptsById = new Map(rows.map(p => [p.id, p])); renderPanel(); })
    .catch(() => toast('Prompts could not load. Refresh to try again.'));

  if (getSession()) {
    await reloadProgress();
    renderAll();
  }

  onAuthChange(async () => {
    await reloadProgress();
    renderAll();
  });
} catch (err) {
  $('quest-path').innerHTML = `<div class="error-state"><h2>The roadmap didn't load</h2><p>${esc(err.message)}. Check your connection and refresh.</p></div>`;
}
